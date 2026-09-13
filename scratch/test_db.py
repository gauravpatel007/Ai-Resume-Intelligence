import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.models import Candidate, User
from app.utils.scoring import score_candidate
from app.utils.roles_catalog import get_role_by_name

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "gattug777@gmail.com").first()
    if user:
        print(f"User found: {user.id}")
        candidate = db.query(Candidate).filter(Candidate.user_id == user.id).first()
        if candidate:
            print(f"Candidate found: {candidate.id}")
            print(f"Target role: {candidate.target_role}")
            print(f"Predicted role: {candidate.predicted_job_role}")
            
            target = candidate.target_role or candidate.predicted_job_role
            print(f"Target: {target}")
            
            role_data = get_role_by_name(target) if target else None
            print(f"Role data: {role_data is not None}")
            
            if role_data:
                req_skills = role_data.get("req_skills", [])
                pref_skills = role_data.get("pref_skills", [])
                
                score_result = score_candidate(
                    candidate=candidate,
                    target_role=target,
                    req_skills=req_skills,
                    pref_skills=pref_skills,
                    min_exp=0,
                    include_explanations=False
                )
                print(f"Total Score: {score_result.get('total_score')}")
                print(f"Skills Score: {score_result.get('skills_score')}")
        else:
            print("Candidate not found by user_id")
    else:
        print("User not found")
finally:
    db.close()
