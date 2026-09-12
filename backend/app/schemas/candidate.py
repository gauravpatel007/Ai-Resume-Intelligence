from pydantic import BaseModel
from typing import Optional, List

class ExperienceBase(BaseModel):
    title: Optional[str] = None
    firm: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    specific_field: Optional[str] = None
    start_date: Optional[str] = None
    location: Optional[str] = None
    class Config:
        from_attributes = True

class AbilityBase(BaseModel):
    description: str
    class Config:
        from_attributes = True

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    predicted_job_role: Optional[str] = None
    alternative_roles: Optional[str] = None
    is_role_uncertain: Optional[bool] = None
    current_role: Optional[str] = None
    target_role: Optional[str] = None
    manual_skills: Optional[str] = None
    extracted_skills: Optional[List[str]] = None
    experiences: Optional[List[ExperienceBase]] = None
    educations: Optional[List[EducationBase]] = None
    abilities: Optional[List[AbilityBase]] = None

class SkillBase(BaseModel):
    name: str
    class Config:
        from_attributes = True

class UnifiedSkill(BaseModel):
    name: str
    source: str # "extracted" or "manual"

class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    predicted_job_role: Optional[str] = None
    alternative_roles: Optional[str] = None
    is_role_uncertain: Optional[bool] = None
    current_role: Optional[str] = None
    target_role: Optional[str] = None
    
    skills: List[SkillBase] = []
    manual_skills: Optional[str] = None
    all_skills: List[UnifiedSkill] = []
    
    experiences: List[ExperienceBase] = []
    educations: List[EducationBase] = []
    abilities: List[AbilityBase] = []
    
    class Config:
        from_attributes = True


class GapReportRequest(BaseModel):
    target_role: str
    req_skills: List[str]
    pref_skills: List[str] = []
    min_exp: int = 0
    req_degree: str = "Any"

class GapAdvice(BaseModel):
    skill: str
    advice: str

class GapReportResponse(BaseModel):
    target_role: str
    matched_skills: List[str] = []
    present_skills: List[str] = []
    missing_skills: List[GapAdvice] = []
    explanations: List[dict] = []
    score: float = 0.0

class InterviewGenerateRequest(BaseModel):
    job_role: str
    package: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    interview_type: str  # "mcq" or "normal"

class InterviewQuestion(BaseModel):
    id: int
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None

class InterviewGenerateResponse(BaseModel):
    questions: List[InterviewQuestion]
