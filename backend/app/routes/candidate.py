from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from ..database.database import get_db
from ..models.models import User, Candidate, Skill, Experience, Education, Ability, UploadedResume, InterviewSession
from ..schemas.candidate import CandidateProfileResponse, CandidateUpdate, GapReportRequest, GapReportResponse, GapAdvice, InterviewGenerateRequest, InterviewGenerateResponse
from ..utils.auth import get_current_user
from ..utils.scoring import score_candidate, calculate_total_experience
from ..utils.learning import get_learning_advice
from ..utils.roles_catalog import get_all_roles, get_role_by_name
from ..services.interview_service import generate_questions

router = APIRouter(prefix="/api/candidate", tags=["candidate"])

@router.get("/roles/catalog")
def get_roles_catalog(current_user: User = Depends(get_current_user)):
    return {"roles": get_all_roles()}


@router.get("/me", response_model=CandidateProfileResponse)
def get_candidate_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can access this profile")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).options(
        selectinload(Candidate.skills),
        selectinload(Candidate.abilities),
        selectinload(Candidate.experiences),
        selectinload(Candidate.educations)
    ).first()
    
    if not candidate:
        # Fallback search by email if user_id was not linked
        candidate = db.query(Candidate).filter(Candidate.email == current_user.email).first()
        if candidate:
            candidate.user_id = current_user.id
            db.commit()
            db.refresh(candidate)
        else:
            default_name = current_user.email.split('@')[0].replace('.', ' ').title()
            candidate = Candidate(user_id=current_user.id, email=current_user.email, name=default_name)
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        candidate = db.query(Candidate).filter(Candidate.id == candidate.id).options(
            selectinload(Candidate.skills),
            selectinload(Candidate.abilities),
            selectinload(Candidate.experiences),
            selectinload(Candidate.educations)
        ).first()
        
    extracted_skills = [{"name": s.name, "source": "extracted"} for s in getattr(candidate, 'skills', [])]
    manual_skills = [{"name": s.strip(), "source": "manual"} for s in (getattr(candidate, 'manual_skills', '') or '').split(',') if s.strip()]
    setattr(candidate, "all_skills", extracted_skills + manual_skills)
        
    return candidate

@router.put("/me", response_model=CandidateProfileResponse)
def update_candidate_me(
    profile_update: CandidateUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can access this profile")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).options(
        selectinload(Candidate.skills),
        selectinload(Candidate.abilities),
        selectinload(Candidate.experiences),
        selectinload(Candidate.educations)
    ).first()
    if not candidate:
        candidate = db.query(Candidate).filter(Candidate.email == current_user.email).first()
        if candidate:
            candidate.user_id = current_user.id
        else:
            default_name = profile_update.name or current_user.email.split('@')[0].replace('.', ' ').title()
            candidate = Candidate(user_id=current_user.id, email=current_user.email, name=default_name)
            db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
    # 1. Update basic info (Email is protected and cannot be changed)
    if profile_update.name is not None:
        candidate.name = profile_update.name.strip()
    if profile_update.phone is not None:
        candidate.phone = profile_update.phone.strip()
    if profile_update.linkedin is not None:
        candidate.linkedin = profile_update.linkedin.strip()
    if profile_update.city is not None:
        candidate.city = profile_update.city.strip()
    if profile_update.state is not None:
        candidate.state = profile_update.state.strip()
    if profile_update.country is not None:
        candidate.country = profile_update.country.strip()
    if profile_update.predicted_job_role is not None:
        candidate.predicted_job_role = profile_update.predicted_job_role.strip()
    if profile_update.current_role is not None:
        candidate.current_role = profile_update.current_role.strip()
    if profile_update.target_role is not None:
        candidate.target_role = profile_update.target_role.strip()
    if profile_update.manual_skills is not None:
        candidate.manual_skills = profile_update.manual_skills

    # 2. Update extracted skills if provided
    if profile_update.extracted_skills is not None:
        new_skill_objects = []
        for s_name in profile_update.extracted_skills:
            clean_s = s_name.strip()
            if not clean_s:
                continue
            skill_obj = db.query(Skill).filter(Skill.name.ilike(clean_s)).first()
            if not skill_obj:
                skill_obj = Skill(name=clean_s)
                db.add(skill_obj)
                db.flush()
            new_skill_objects.append(skill_obj)
        candidate.skills = new_skill_objects

    # 3. Update experiences (Add / Edit / Remove)
    if profile_update.experiences is not None:
        candidate.experiences = []
        db.flush()
        for exp in profile_update.experiences:
            if (exp.title and exp.title.strip()) or (exp.firm and exp.firm.strip()):
                candidate.experiences.append(Experience(
                    candidate_id=candidate.id,
                    title=exp.title.strip() if exp.title else "",
                    firm=exp.firm.strip() if exp.firm else "",
                    start_date=exp.start_date.strip() if exp.start_date else None,
                    end_date=exp.end_date.strip() if exp.end_date else None,
                    location=exp.location.strip() if exp.location else None
                ))
        db.flush()
        candidate.total_experience_years = calculate_total_experience(candidate.experiences)

    # 4. Update educations (Add / Edit / Remove)
    if profile_update.educations is not None:
        candidate.educations = []
        db.flush()
        highest_deg = 0
        for edu in profile_update.educations:
            if (edu.institution and edu.institution.strip()) or (edu.degree and edu.degree.strip()):
                candidate.educations.append(Education(
                    candidate_id=candidate.id,
                    institution=edu.institution.strip() if edu.institution else "",
                    degree=edu.degree.strip() if edu.degree else "",
                    specific_field=edu.specific_field.strip() if edu.specific_field else None,
                    start_date=edu.start_date.strip() if edu.start_date else None,
                    location=edu.location.strip() if edu.location else None
                ))
                deg_lower = (edu.degree or "").lower()
                if "phd" in deg_lower or "doctor" in deg_lower:
                    highest_deg = max(highest_deg, 3)
                elif "master" in deg_lower or "m.s" in deg_lower or "m.tech" in deg_lower:
                    highest_deg = max(highest_deg, 2)
                elif "bachelor" in deg_lower or "b.s" in deg_lower or "b.tech" in deg_lower:
                    highest_deg = max(highest_deg, 1)
        candidate.highest_degree_level = highest_deg

    # 5. Update abilities (Add / Edit / Remove)
    if profile_update.abilities is not None:
        candidate.abilities = []
        db.flush()
        for ab in profile_update.abilities:
            if ab.description and ab.description.strip():
                candidate.abilities.append(Ability(
                    candidate_id=candidate.id,
                    description=ab.description.strip()
                ))

    db.commit()
    db.refresh(candidate)
    
    # Reload with all relationships
    candidate = db.query(Candidate).filter(Candidate.id == candidate.id).options(
        selectinload(Candidate.skills),
        selectinload(Candidate.abilities),
        selectinload(Candidate.experiences),
        selectinload(Candidate.educations)
    ).first()
    
    extracted_skills = [{"name": s.name, "source": "extracted"} for s in candidate.skills]
    manual_skills = [{"name": s.strip(), "source": "manual"} for s in (getattr(candidate, 'manual_skills', '') or '').split(',') if s.strip()]
    setattr(candidate, "all_skills", extracted_skills + manual_skills)
    
    return candidate

@router.get("/all")
def get_all_candidates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view all candidates")
        
    candidates = (
        db.query(Candidate)
        .filter(Candidate.user_id.isnot(None))
        .options(
            selectinload(Candidate.resumes),
            selectinload(Candidate.skills),
            selectinload(Candidate.user)
        )
        .all()
    )
    
    results = []
    for c in candidates:
        try:
            latest_resume = None
            if c.resumes:
                latest_resume = sorted(c.resumes, key=lambda r: str(r.upload_date) if getattr(r, 'upload_date', None) else "", reverse=True)[0]
            
            # Safely get email
            user_email = "N/A"
            if getattr(c, "user", None) and getattr(c.user, "email", None):
                user_email = c.user.email
            email_val = c.email if getattr(c, "email", None) else user_email
            
            results.append({
                "id": c.id,
                "name": getattr(c, "name", None) or "Unknown Candidate",
                "email": email_val,
                "phone": getattr(c, "phone", None),
                "predicted_job_role": getattr(c, "predicted_job_role", None),
                "matched_skills": [s.name for s in getattr(c, "skills", []) if getattr(s, "name", None)],
                "resume_path": getattr(latest_resume, "file_path", None) if latest_resume else None,
                "extracted_text": getattr(latest_resume, "extracted_text", None) if latest_resume else None,
                "upload_date": str(latest_resume.upload_date)[:10] if (latest_resume and getattr(latest_resume, "upload_date", None)) else None
            })
        except Exception as e:
            print(f"Failed to parse candidate {getattr(c, 'id', 'unknown')}: {e}")
            
    return {"candidates": results}

@router.post("/gap-report", response_model=GapReportResponse)
def generate_gap_report(
    req: GapReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can access this")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).options(
        selectinload(Candidate.skills),
        selectinload(Candidate.abilities),
        selectinload(Candidate.experiences),
        selectinload(Candidate.educations),
        selectinload(Candidate.resumes)
    ).first()
    
    if not candidate:
        candidate = db.query(Candidate).filter(Candidate.email == current_user.email).first()
        if candidate:
            candidate.user_id = current_user.id
            db.commit()
            db.refresh(candidate)
        else:
            default_name = current_user.email.split('@')[0].replace('.', ' ').title()
            candidate = Candidate(user_id=current_user.id, email=current_user.email, name=default_name)
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        candidate = db.query(Candidate).filter(Candidate.id == candidate.id).options(
            selectinload(Candidate.skills),
            selectinload(Candidate.abilities),
            selectinload(Candidate.experiences),
            selectinload(Candidate.educations),
            selectinload(Candidate.resumes)
        ).first()
        
    latest_resume = None
    if candidate.resumes:
        latest_resume = sorted(candidate.resumes, key=lambda r: str(r.upload_date) if getattr(r, 'upload_date', None) else "", reverse=True)[0]
    
    profile_text = getattr(latest_resume, "extracted_text", "") if latest_resume else ""
        
    score_result = score_candidate(
        candidate=candidate,
        target_role=req.target_role,
        req_skills=req.req_skills,
        pref_skills=req.pref_skills,
        min_exp=req.min_exp,
        req_degree=req.req_degree,
        profile_text=profile_text
    )
    
    missing_skills_info = []
    present_skills = []
    
    MATCHED_FINDINGS = {"Verified", "Evidence found", "Not verified", "Meets requirement", "Requirement met", "Predicted Role Match", "Past Experience Match"}

    for explanation in score_result.get("explanations", []):
        finding = explanation.get("finding", "")
        skill = explanation.get("requirement", "")
        if not skill:
            continue
        if finding == "Not found":
            missing_skills_info.append(GapAdvice(
                skill=skill,
                advice=get_learning_advice(skill)
            ))
        elif finding in MATCHED_FINDINGS:
            present_skills.append(skill)
    
    # matched_skills from the score breakdown
    matched_skills = score_result.get("matched_required", [])
    # Use title-cased versions for display
    matched_display = [s.title() for s in matched_skills] if matched_skills else present_skills
    
    return GapReportResponse(
        target_role=req.target_role,
        matched_skills=matched_display,
        missing_skills=missing_skills_info,
        present_skills=present_skills,
        explanations=score_result.get("explanations", []),
        score=score_result.get("total_score", 0.0)
    )

@router.post("/interview/generate", response_model=InterviewGenerateResponse)
def generate_interview(
    req: InterviewGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can access this")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if candidate:
        new_session = InterviewSession(candidate_id=candidate.id, role=req.job_role)
        db.add(new_session)
        db.commit()
        
    questions = generate_questions(
        role=req.job_role,
        package=req.package,
        experience=req.experience,
        skills=req.skills,
        interview_type=req.interview_type
    )
            
    return InterviewGenerateResponse(questions=questions)

@router.get("/dashboard/stats")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can access this")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).options(
        selectinload(Candidate.skills),
        selectinload(Candidate.experiences),
        selectinload(Candidate.educations)
    ).first()
    
    if not candidate:
        candidate = db.query(Candidate).filter(Candidate.email == current_user.email).first()
        if candidate:
            candidate.user_id = current_user.id
            db.commit()
            db.refresh(candidate)
            candidate = db.query(Candidate).filter(Candidate.id == candidate.id).options(
                selectinload(Candidate.skills),
                selectinload(Candidate.experiences),
                selectinload(Candidate.educations)
            ).first()
    
    if not candidate:
        return {"candidate_name": None, "resumes_analyzed": 0, "skill_score": 0, "interviews": 0, "profile_score": 0}
        
    resumes_analyzed = db.query(UploadedResume).filter(UploadedResume.candidate_id == candidate.id).count()
    interviews = db.query(InterviewSession).filter(InterviewSession.candidate_id == candidate.id).count()
    
    # Profile Score Calculation
    # 15% Basic Info (Name, Location)
    # 15% Contact Info (Phone, LinkedIn)
    # 30% Skills Added
    # 20% Experience Added
    # 20% Education Added
    
    score = 0
    if candidate.name and candidate.city:
        score += 15
    elif candidate.name or candidate.city:
        score += 7
        
    if candidate.phone and candidate.linkedin:
        score += 15
    elif candidate.phone or candidate.linkedin:
        score += 7
        
    if candidate.skills or candidate.manual_skills:
        score += 30
        
    if candidate.experiences:
        score += 20
        
    if candidate.educations:
        score += 20
        
    profile_score = score
    
    # Skill Score Calculation against target role
    skill_score = 0
    if candidate.target_role or candidate.predicted_job_role:
        target = candidate.target_role or candidate.predicted_job_role
        role_data = get_role_by_name(target)
        
        req_skills = role_data.get("req_skills", []) if role_data else []
        pref_skills = role_data.get("pref_skills", []) if role_data else []
        
        extracted_skills = [{"name": s.name} for s in candidate.skills] if candidate.skills else []
        manual_skills = [{"name": s.strip()} for s in (candidate.manual_skills or '').split(',') if s.strip()]
        setattr(candidate, "all_skills", extracted_skills + manual_skills)
        
        score_result = score_candidate(
            candidate=candidate,
            target_role=target,
            req_skills=req_skills,
            pref_skills=pref_skills,
            min_exp=0,
            include_explanations=False
        )
        
        # skills_score is max 40. We want a percentage (0-100) for the UI "Skill Score".
        skills_part = score_result.get("skills_score", 0.0)
        
        all_candidate_skills = (candidate.skills or []) + (candidate.manual_skills.split(',') if getattr(candidate, 'manual_skills', None) else [])
        all_candidate_skills = [s for s in all_candidate_skills if s and str(s).strip()]
        
        # If there are no required skills (e.g. role not matched), score_candidate gives free points (40).
        # We don't want to show 100% just because they have 1 skill.
        if not req_skills:
            if not all_candidate_skills:
                skill_score = 0
            else:
                # Baseline scoring: assume a strong profile has about 10 skills
                skill_score = min(len(all_candidate_skills) * 10, 100)
        else:
            skill_score = int((skills_part / 40.0) * 100)

            
    return {
        "candidate_name": candidate.name if candidate and candidate.name else None,
        "resumes_analyzed": resumes_analyzed,
        "skill_score": skill_score,
        "interviews": interviews,
        "profile_score": profile_score
    }
