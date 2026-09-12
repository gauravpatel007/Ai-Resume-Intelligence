import os
import sys
import time
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import engine, Base, SessionLocal
from app.models.models import Candidate, Skill, Experience, Education, Ability, candidate_skills
from app.utils.nlp import standardize_degree

# Paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dataset")

def run_import():
    start_time = time.time()
    print("🚀 Starting ultra-fast bulk import...")
    
    print("Ensuring tables exist...")
    Base.metadata.create_all(bind=engine)
    
    # 1. IMPORT CANDIDATES
    t0 = time.time()
    print("1/6 📥 Loading candidates from 01_people_FINAL.csv...")
    people_file = os.path.join(DATA_DIR, "01_people_FINAL.csv")
    if not os.path.exists(people_file):
        people_file = os.path.join(DATA_DIR, "01_people.csv")
        
    df_people = pd.read_csv(people_file, low_memory=False).dropna(how='all')
    df_people = df_people[df_people['person_id'].notna()]
    
    first_person_id = int(df_people['person_id'].iloc[0]) if not df_people.empty else None

    session = SessionLocal()
    try:
        # Check if the specific dataset candidates already exist
        if first_person_id and session.query(Candidate.id).filter_by(id=first_person_id).first():
            print("⚠️ Database already contains the imported dataset. If you want a fresh import, run 'python scripts/reset_db.py' first.")
            return
    finally:
        session.close()
    
    candidates_df = pd.DataFrame({
        'id': df_people['person_id'].astype(int),
        'name': df_people['Name'] if 'Name' in df_people.columns else (df_people['name'] if 'name' in df_people.columns else None),
        'role': df_people['Role'] if 'Role' in df_people.columns else None,
        'email': df_people['email'] if 'email' in df_people.columns else None,
        'phone': df_people['phone'] if 'phone' in df_people.columns else None,
        'linkedin': df_people['linkedin'] if 'linkedin' in df_people.columns else None,
        'city': df_people['City'] if 'City' in df_people.columns else (df_people['city'] if 'city' in df_people.columns else None),
        'state': df_people['State'] if 'State' in df_people.columns else (df_people['state'] if 'state' in df_people.columns else None),
        'country': df_people['Country'] if 'Country' in df_people.columns else (df_people['country'] if 'country' in df_people.columns else None),
        'predicted_job_role': None,
        'combined_profile_text': None,
        'user_id': None
    })
    
    with engine.begin() as conn:
        print("   ⏳ Starting import transaction...")
        candidates_df.to_sql('candidates', con=conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print(f"   ✅ Inserted {len(candidates_df):,} candidates in {time.time()-t0:.1f}s.")

        # 2. IMPORT SKILLS
        t0 = time.time()
        print("2/6 📥 Importing skills vocabulary from 06_skills.csv...")
        df_skills = pd.read_csv(os.path.join(DATA_DIR, "06_skills.csv"), low_memory=False)
        unique_skills = (
            df_skills['skill']
            .dropna()
            .astype(str)
            .str.strip()
            .str.title()
            .drop_duplicates()
        )
        skills_df = pd.DataFrame({'name': unique_skills})
        skills_df.to_sql('skills', con=conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print(f"   ✅ Inserted {len(skills_df):,} unique skills in {time.time()-t0:.1f}s.")

        # Fetch skill IDs map within the transaction
        db_skills = pd.read_sql_query("SELECT id, name FROM skills", con=conn)
        skill_to_id = dict(zip(db_skills['name'], db_skills['id']))

        # 3. IMPORT CANDIDATE_SKILLS (M2M)
        t0 = time.time()
        print("3/6 📥 Importing candidate skills mapping from 05_person_skills.csv (2.4M rows)...")
        df_ps = pd.read_csv(os.path.join(DATA_DIR, "05_person_skills.csv"), low_memory=False).dropna(subset=['person_id', 'skill'])
        df_ps['skill_clean'] = df_ps['skill'].astype(str).str.strip().str.title()
        df_ps['skill_id'] = df_ps['skill_clean'].map(skill_to_id)
        
        valid_ps = df_ps.dropna(subset=['skill_id'])
        m2m_df = pd.DataFrame({
            'candidate_id': valid_ps['person_id'].astype(int),
            'skill_id': valid_ps['skill_id'].astype(int)
        }).drop_duplicates()
        
        m2m_df.to_sql('candidate_skills', con=conn, if_exists='append', index=False, chunksize=25000, method='multi')
        print(f"   ✅ Inserted {len(m2m_df):,} candidate-skill mappings in {time.time()-t0:.1f}s.")

        # 4. IMPORT EXPERIENCES
        t0 = time.time()
        print("4/6 📥 Importing experiences from 04_experience.csv...")
        df_exp = pd.read_csv(os.path.join(DATA_DIR, "04_experience.csv"), low_memory=False).dropna(subset=['person_id'])
        
        exp_df = pd.DataFrame({
            'candidate_id': df_exp['person_id'].astype(int),
            'title': df_exp['title'].astype(str).str.strip().str.title().replace({'Nan': None, 'None': None, '': None}) if 'title' in df_exp.columns else None,
            'firm': df_exp['firm'] if 'firm' in df_exp.columns else None,
            'start_date': df_exp['start_date'] if 'start_date' in df_exp.columns else None,
            'end_date': df_exp['end_date'] if 'end_date' in df_exp.columns else None,
            'location': df_exp['location'] if 'location' in df_exp.columns else None
        })
        exp_df.to_sql('experiences', con=conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print(f"   ✅ Inserted {len(exp_df):,} experiences in {time.time()-t0:.1f}s.")

        # 5. IMPORT EDUCATION
        t0 = time.time()
        print("5/6 📥 Importing education from 03_education.csv...")
        df_edu = pd.read_csv(os.path.join(DATA_DIR, "03_education.csv"), low_memory=False).dropna(subset=['person_id'])
        
        # Parse degree and specific_field
        if 'program' in df_edu.columns:
            parsed_programs = df_edu['program'].astype(str).apply(standardize_degree)
            df_edu['degree'] = parsed_programs.apply(lambda x: x.get('degree'))
            df_edu['specific_field'] = parsed_programs.apply(lambda x: x.get('specific_field'))
        else:
            df_edu['degree'] = None
            df_edu['specific_field'] = None
            
        edu_df = pd.DataFrame({
            'candidate_id': df_edu['person_id'].astype(int),
            'institution': df_edu['institution'] if 'institution' in df_edu.columns else None,
            'degree': df_edu['degree'],
            'specific_field': df_edu['specific_field'],
            'start_date': df_edu['start_date'] if 'start_date' in df_edu.columns else None,
            'location': df_edu['location'] if 'location' in df_edu.columns else None
        })
        edu_df.to_sql('educations', con=conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print(f"   ✅ Inserted {len(edu_df):,} educations in {time.time()-t0:.1f}s.")

        # 6. IMPORT ABILITIES
        t0 = time.time()
        print("6/6 📥 Importing abilities from 02_abilities.csv (1.2M rows)...")
        df_ab = pd.read_csv(os.path.join(DATA_DIR, "02_abilities.csv"), low_memory=False).dropna(subset=['person_id'])
        ability_col = 'ability' if 'ability' in df_ab.columns else 'description'
        ab_df = pd.DataFrame({
            'candidate_id': df_ab['person_id'].astype(int),
            'description': df_ab[ability_col].astype(str).str.strip().replace({'Nan': None, 'None': None, '': None})
        })
        ab_df.to_sql('abilities', con=conn, if_exists='append', index=False, chunksize=25000, method='multi')
        print(f"   ✅ Inserted {len(ab_df):,} abilities in {time.time()-t0:.1f}s.")
        
        print("   ✅ Transaction committed successfully.")

    # 6.5 CALCULATE METRICS
    t0 = time.time()
    print("6.5/7 🔄 Calculating Candidate metrics (experience & education)...")
    from sqlalchemy.orm import selectinload
    from app.utils.scoring import calculate_total_experience
    session = SessionLocal()
    try:
        candidates = session.query(Candidate).options(
            selectinload(Candidate.experiences),
            selectinload(Candidate.educations)
        ).all()
        for c in candidates:
            c.total_experience_years = calculate_total_experience(c.experiences)
            
            highest = 0
            for ed in c.educations:
                if ed.degree:
                    d = ed.degree.lower()
                    if 'phd' in d or 'doctor' in d: highest = max(highest, 3)
                    elif 'master' in d: highest = max(highest, 2)
                    elif 'bachelor' in d: highest = max(highest, 1)
            c.highest_degree_level = highest
            
        session.commit()
        print(f"   ✅ Metrics updated for {len(candidates)} candidates in {time.time()-t0:.1f}s.")
    except Exception as e:
        print(f"⚠️ Failed to calculate metrics: {e}")
        session.rollback()
    finally:
        session.close()

    # 7. SYNCHRONIZE SEQUENCE & VERIFY
    t0 = time.time()
    print("7/7 🔄 Synchronizing database sequence and verifying...")
    session = SessionLocal()
    try:
        if engine.dialect.name == 'postgresql':
            query = text("SELECT setval(pg_get_serial_sequence('candidates', 'id'), coalesce(max(id),0) + 1, false) FROM candidates;")
            session.execute(query)
            session.commit()
            print(f"   ✅ PostgreSQL sequence synchronized in {time.time()-t0:.1f}s.")
        
        print("   🔍 Verifying sequence with a test candidate insertion...")
        test_candidate = Candidate(
            name="Sequence Test User",
            email="sequence_test@example.com",
            role="Test Role"
        )
        session.add(test_candidate)
        session.commit()
        
        test_id = test_candidate.id
        print(f"   ✅ Integration check passed: Generated ID {test_id} successfully.")
        
        session.delete(test_candidate)
        session.commit()
    except Exception as e:
        print(f"⚠️ Sequence synchronization or check failed: {e}")
        session.rollback()
    finally:
        session.close()

    total_time = time.time() - start_time
    print(f"\n🎉 ALL DATASETS IMPORTED SUCCESSFULLY in {total_time:.1f}s (~{total_time/60:.1f} minutes)!")

if __name__ == "__main__":
    run_import()
