import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models.models import User, UploadedResume
from ..utils.auth import get_current_user
from ..utils.pdf import extract_text_from_pdf
from ..utils.nlp import parse_resume_text

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only candidates can upload resumes
    if current_user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can upload resumes")
        
    # Check Candidate profile exists, auto-heal if missing
    candidate = current_user.candidate_profile
    if not candidate:
        # Self-healing logic for accounts broken by the previous database sequence bug
        from ..models.models import Candidate
        candidate = Candidate(user_id=current_user.id, email=current_user.email, name="Unknown")
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
    # 1. Validate File Type
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    # 2. Read and Validate File Size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds the 5MB limit")

    # 3. Extract Text and Run NLP/ML Pipeline
    try:
        extracted_text = extract_text_from_pdf(file_bytes)
        parsed_data = parse_resume_text(extracted_text, db)
        
        # Extract Degree for ML
        from ..utils.nlp import standardize_degree
        degree_data = standardize_degree(extracted_text)
        degree = degree_data.get("degree")
        if degree == "PhD":
            degree_level = 3.0
        elif degree == "Master":
            degree_level = 2.0
        elif degree == "Bachelor":
            degree_level = 1.0
        else:
            degree_level = 0.0
        parsed_data["extracted_degree"] = degree
        
        # --- Start Experience parsing for ML ---
        from ..models.models import Skill, Experience, Education, Ability
        from ..utils.scoring import calculate_total_experience
        import re
        
        new_experiences = []
        for ex_text in parsed_data["sections"].get("experience", []):
            years = re.findall(r'\b(?:19|20)\d{2}\b', ex_text)
            start_dt, end_dt = None, None
            
            if len(years) >= 2:
                start_dt, end_dt = years[0], years[1]
            elif len(years) == 1:
                start_dt = years[0]
                if re.search(r'\b(present|current)\b', ex_text, re.IGNORECASE):
                    end_dt = "Present"
                    
            new_exp = Experience(
                candidate_id=candidate.id, 
                title=ex_text, 
                start_date=start_dt, 
                end_date=end_dt
            )
            new_experiences.append(new_exp)
            
        calculated_exp = calculate_total_experience(new_experiences)
        
        # ML Prediction
        from ..utils.ml import predict_job_role
        prediction_result = predict_job_role(extracted_text, experience_years=calculated_exp, degree_level=degree_level)
        if prediction_result:
            predicted_role = prediction_result.get("primary_role")
            if predicted_role:
                parsed_data["predicted_role"] = predicted_role
                candidate.predicted_job_role = predicted_role
                
            import json
            alternative_roles = prediction_result.get("alternative_roles", [])
            candidate.alternative_roles = json.dumps(alternative_roles)
            
            is_uncertain = prediction_result.get("is_uncertain", False)
            candidate.is_role_uncertain = is_uncertain
            
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Pipeline failed: {str(e)}")

    # 4. Save file to disk
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    # 5. Save metadata to DB
    new_resume = UploadedResume(
        candidate_id=candidate.id,
        file_path=file_path,
        upload_date=datetime.utcnow(),
        extracted_text=extracted_text
    )
    db.add(new_resume)
    
    # 6. Update Candidate Profile with NLP Data
    if not candidate.phone and parsed_data["contact"]["phone"]:
        candidate.phone = parsed_data["contact"]["phone"]
    if parsed_data["entities"]["name_guesses"] and (not candidate.name or candidate.name == "Unknown"):
        candidate.name = parsed_data["entities"]["name_guesses"][0]
        
    candidate.combined_profile_text = extracted_text
    
    # --- Start of Bug 02 Fix Additions ---
    candidate.highest_degree_level = int(degree_level)
    
    # Explicit Replacement Policy
    db.query(Experience).filter(Experience.candidate_id == candidate.id).delete()
    db.query(Education).filter(Education.candidate_id == candidate.id).delete()
    db.query(Ability).filter(Ability.candidate_id == candidate.id).delete()
    candidate.skills = []
    
    if parsed_data.get("matched_skills"):
        candidate.skills = db.query(Skill).filter(Skill.name.in_(parsed_data["matched_skills"])).all()
        
    for ab_text in parsed_data["sections"].get("abilities", []):
        db.add(Ability(candidate_id=candidate.id, description=ab_text))
        
    for ed_text in parsed_data["sections"].get("education", []):
        if " — " in ed_text:
            deg, inst = ed_text.split(" — ", 1)
            db.add(Education(candidate_id=candidate.id, degree=deg, institution=inst))
        else:
            db.add(Education(candidate_id=candidate.id, institution=ed_text))
            
    for exp in new_experiences:
        db.add(exp)
        
    candidate.total_experience_years = calculated_exp
    # --- End of Bug 02 Fix Additions ---
        
    db.commit()
    db.refresh(new_resume)

    # 7. Return response
    return {
        "status": "success",
        "message": "Resume uploaded and NLP processed successfully",
        "resume_id": new_resume.id,
        "parsed_data": parsed_data,
        "extracted_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
    }
