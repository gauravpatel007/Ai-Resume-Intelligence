import os
import sys
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from backend.app.database.database import SessionLocal
from backend.app.models.models import Candidate
from backend.app.utils.scoring import calculate_total_experience

def calculate_metrics():
    db: Session = SessionLocal()
    
    print("Fetching candidates...")
    chunk_size = 1000
    offset = 0
    
    total = db.query(Candidate).count()
    print(f"Total candidates: {total}")
    
    processed = 0
    updated = 0
    
    while True:
        candidates = db.query(Candidate).offset(offset).limit(chunk_size).all()
        if not candidates:
            break
            
        for c in candidates:
            # Experience
            exp_years = calculate_total_experience(c.experiences)
            # Ensure it's never negative due to bad dates
            c.total_experience_years = max(0.0, exp_years)
            
            # Degree
            # 0=None, 1=Bachelor, 2=Master, 3=PhD
            highest = 0
            for edu in c.educations:
                degree = (edu.degree or "").lower()
                if "phd" in degree or "doctor" in degree:
                    highest = max(highest, 3)
                elif "master" in degree:
                    highest = max(highest, 2)
                elif "bachelor" in degree:
                    highest = max(highest, 1)
                    
            c.highest_degree_level = highest
            updated += 1
            
        db.commit()
        processed += len(candidates)
        print(f"Processed {processed}/{total} candidates...")
        offset += chunk_size
        
    print(f"Done. Updated {updated} candidates.")
    db.close()

if __name__ == "__main__":
    calculate_metrics()
