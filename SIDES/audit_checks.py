"""Read-only project audit using synthetic data and an in-memory database.
Run: backend/venv/Scripts/python.exe audit_checks.py
"""
import os
os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['SECRET_KEY'] = 'isolated-audit-only-key'
import ast
import asyncio
import io
import json
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'backend'))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import database
database.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
database.SessionLocal = sessionmaker(bind=database.engine)
from app.main import app
from app.models.models import Base, User, Candidate, Skill, Experience, Education, Ability
from app.utils.scoring import calculate_total_experience, score_candidate
from app.utils.nlp import extract_skills, standardize_degree
from app.utils.auth import get_current_user
from app.routes import upload
from app.utils import ml
from fastapi.testclient import TestClient
from starlette.datastructures import UploadFile, Headers

results = {}
def record(name, value):
    results[name] = value
    print(name + ': ' + json.dumps(value, default=str), flush=True)

python_files = [p for p in ROOT.rglob('*.py') if not any(x in p.parts for x in ['venv', 'node_modules', '__pycache__'])]
errors = []
for p in python_files:
    try:
        ast.parse(p.read_text(encoding='utf-8-sig'))
    except Exception as e:
        errors.append({'file': str(p.relative_to(ROOT)), 'error': str(e)})
record('python_syntax', {'files': len(python_files), 'errors': errors})
notebooks = []
for p in ROOT.glob('*.ipynb'):
    nb = json.loads(p.read_text(encoding='utf-8-sig'))
    saved_errors = [o.get('ename') for c in nb.get('cells', []) for o in c.get('outputs', []) if o.get('output_type') == 'error']
    notebooks.append({'file': p.name, 'cells': len(nb.get('cells', [])), 'saved_errors': saved_errors})
record('notebook_inventory', notebooks)

db = database.SessionLocal()
admin = User(email='audit-admin@example.com', password_hash='unused', role='admin')
db.add(admin)
for i in range(1, 102):
    c = Candidate(id=i, name=f'Audit {i:03}', predicted_job_role='Engineer', city='Ahmedabad', state='Gujarat', country='India')
    if i == 101:
        c.skills = [Skill(name='Python')]
        c.educations = [Education(degree='Master')]
        c.abilities = [Ability(description='Synthetic ability')]
    db.add(c)
db.commit()
app.dependency_overrides[database.get_db] = lambda: db
app.dependency_overrides[get_current_user] = lambda: admin
client = TestClient(app, raise_server_exceptions=False)
record('health', client.get('/api/health').status_code)
r = client.post('/api/search/candidates', json={'target_job_role': 'Engineer', 'required_skills': ['Python']})
body = r.json()
record('search_cap', {'status': r.status_code, 'total_filtered': body.get('total_filtered'), 'result_ids': [x['candidate_id'] for x in body.get('results', [])], 'best_candidate_101_included': any(x['candidate_id']==101 for x in body.get('results', []))})
r = client.post('/api/search/candidates', json={})
record('default_any_search', {'status': r.status_code, 'total_filtered': r.json().get('total_filtered')})
r = client.post('/api/search/explore', json={'target_job_role': None})
record('null_target_role', {'status': r.status_code, 'body': r.text})
record('location_suggestion', client.get('/api/search/explore/locations?q=India').json())
record('location_as_sent_by_frontend', client.post('/api/search/explore', json={'city': 'India'}).json()['total_filtered'])
record('explore_first_page_ids', [x['candidate_id'] for x in client.post('/api/search/explore', json={'target_job_role':'Engineer','limit':16}).json()['results']])
record('experience_same_year', calculate_total_experience([SimpleNamespace(start_date='01/2020',end_date='12/2020')]))
record('experience_overlapping', calculate_total_experience([SimpleNamespace(start_date='2020',end_date='2022'),SimpleNamespace(start_date='2020',end_date='2022')]))
best = db.get(Candidate,101)
best.educations = [Education(degree='Bachelor')]
record('master_collection_requirement', score_candidate(best, 'Engineer', [], [], None, "Master's")['education_abilities_score'])
record('canonical_master_requirement', score_candidate(best, 'Engineer', [], [], None, 'Master')['education_abilities_score'])
record('standardize_engineering', standardize_degree('Bachelor of Engineering'))
record('standardize_phd', standardize_degree('PhD in Computer Science'))
for name in ['Machine Learning','C++','C#','Node.js']:
    db.add(Skill(name=name))
db.commit()
record('skill_extraction', extract_skills('Python Machine Learning C++ C# Node.js', db))
u = User(email='audit-candidate@example.com',password_hash='unused',role='candidate')
c = Candidate(name='Audit Upload',user=u)
db.add(c)
db.commit()
parsed = {'contact':{'phone':'1234567890'},'entities':{'name_guesses':['Audit Upload']},'matched_skills':['Python'],'sections':{'education':['Master'], 'experience':['Engineer 2020-2025'], 'abilities':['Build software'], 'skills':['Python']}}
with tempfile.TemporaryDirectory(prefix='resume-audit-') as temp:
    f = UploadFile(io.BytesIO(b'synthetic'),filename='audit.pdf', headers=Headers({'content-type':'application/pdf'}))
    with patch.object(upload,'UPLOAD_DIR',temp), patch.object(upload,'extract_text_from_pdf',return_value='Master Python Engineer 2020-2025'), patch.object(upload,'parse_resume_text',return_value=parsed), patch.object(ml,'predict_job_role',return_value='Engineer') as prediction:
        response = asyncio.run(upload.upload_resume(file=f,current_user=u,db=db))
        record('upload_persistence', {'status':response['status'],'skills':len(c.skills),'experiences':len(c.experiences),'educations':len(c.educations),'abilities':len(c.abilities),'total_experience_years':c.total_experience_years,'highest_degree_level':c.highest_degree_level,'prediction_experience':prediction.call_args.kwargs['experience_years']})
record('model_smoke', {'loaded': ml.get_job_role_predictor() is not None, 'prediction': ml.predict_job_role('Python SQL machine learning data analysis',5,2)})
pdf_response = client.post('/api/export/candidate/101/pdf',json={'target_job_role':'Engineer'})
record('pdf_smoke', {'status':pdf_response.status_code,'pdf_header':pdf_response.content[:5].decode(errors='replace')})
app.dependency_overrides.clear()
app.dependency_overrides[database.get_db] = lambda: db
record('anonymous_search_status',client.post('/api/search/candidates',json={}).status_code)
registration = client.post('/api/auth/register',json={'name':'Audit New','email':'audit-new@example.com','password':'audit-password'})
login = client.post('/api/auth/login',data={'username':'audit-new@example.com','password':'audit-password'})
record('auth_smoke', {'register_status':registration.status_code,'login_status':login.status_code})
token = login.json().get('access_token','')
record('candidate_search_forbidden',client.post('/api/search/candidates',json={},headers={'Authorization':'Bearer '+token}).status_code)
bad_registration = client.post('/api/auth/register',json={'name':'Audit','email':'audit@localhost','password':'test'})
record('invalid_registration', {'status':bad_registration.status_code,'detail_is_list':isinstance(bad_registration.json().get('detail'),list)})
db.close()
if __name__ == '__main__':
    (ROOT/'audit_check_results.json').write_text(json.dumps(results,indent=2,default=str),encoding='utf-8')
