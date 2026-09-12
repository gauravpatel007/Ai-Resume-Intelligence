from pydantic import BaseModel, Field
from typing import List, Optional, Dict

from enum import Enum

class DegreeType(str, Enum):
    any = "Any"
    bachelor = "Bachelor"
    master = "Master"
    phd = "PhD"

class SearchQuery(BaseModel):
    target_job_role: str = Field(default="Any", description="Target job role")
    search_name: Optional[str] = Field(default=None, description="Optional name to search for a specific candidate")
    required_skills: List[str] = Field(default=[], description="List of required skills")
    preferred_skills: List[str] = Field(default=[], description="List of preferred skills")
    min_experience_years: Optional[int] = Field(default=None, ge=0, le=70, description="Minimum years of experience")
    required_degree: Optional[DegreeType] = Field(default=DegreeType.any, description="Degree Category (Master, Bachelor, PhD, Any)")


class CandidateAnalysis(BaseModel):
    strengths: str
    weak_areas: str
    recommendation: str

class MatchEvidence(BaseModel):
    requirement: str
    finding: str
    evidence: str

class ScoreBreakdown(BaseModel):
    total_score: float
    skills_score: float
    experience_score: float
    role_score: float
    education_abilities_score: float
    matched_required: List[str]
    missing_required: List[str]
    matched_preferred: List[str]
    explanations: List[MatchEvidence] = []
    analysis: CandidateAnalysis

class CandidateMatch(BaseModel):
    candidate_id: int
    name: Optional[str]
    role: Optional[str]
    email: Optional[str]
    phone: Optional[str] = None
    education_level: Optional[str] = None
    predicted_job_role: Optional[str]
    alternative_roles: Optional[str] = None
    is_role_uncertain: Optional[bool] = None
    calculated_experience_years: float
    profile_text: Optional[str] = None
    score_breakdown: ScoreBreakdown

class SearchResponse(BaseModel):
    status: str = "success"
    total_candidates: int
    total_filtered: int
    results: List[CandidateMatch]

class ExploreQuery(BaseModel):
    target_job_role: str = Field(default="Any", description="Target job role")
    required_skills: List[str] = Field(default=[], description="List of required skills")
    min_experience_years: Optional[int] = Field(default=None, ge=0, le=70, description="Minimum years of experience")
    required_degree: Optional[DegreeType] = Field(default=DegreeType.any, description="Degree Category (Master, Bachelor, PhD, Any)")
    location: Optional[str] = None
    limit: int = Field(default=16, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
