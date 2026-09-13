from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base

# Association table for Candidate <-> Skill (Many-to-Many)
candidate_skills = Table(
    "candidate_skills",
    Base.metadata,
    Column("candidate_id", Integer, ForeignKey("candidates.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="candidate") # "candidate" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

    # A user can be linked to a candidate profile
    candidate_profile = relationship("Candidate", back_populates="user", uselist=False)

    @property
    def name(self):
        if self.candidate_profile and self.candidate_profile.name:
            return self.candidate_profile.name
        return None


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True) # Will use person_id from dataset for existing ones
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String, index=True, nullable=True)
    role = Column(String, index=True, nullable=True) # Actual role from dataset
    email = Column(String, index=True, nullable=True)
    phone = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    
    city = Column(String, index=True, nullable=True)
    state = Column(String, index=True, nullable=True)
    country = Column(String, index=True, nullable=True)
    
    predicted_job_role = Column(String, index=True, nullable=True)
    alternative_roles = Column(Text, nullable=True) # JSON string of alternative roles
    is_role_uncertain = Column(Boolean, default=False)
    
    current_role = Column(String, index=True, nullable=True)
    target_role = Column(String, index=True, nullable=True)
    manual_skills = Column(Text, nullable=True) # Comma-separated list of manually added skills
    
    combined_profile_text = Column(Text, nullable=True) # Used for NLP TF-IDF
    
    total_experience_years = Column(Float, default=0.0, index=True)
    highest_degree_level = Column(Integer, default=0, index=True) # 0=None, 1=Bachelor, 2=Master, 3=PhD

    
    user = relationship("User", back_populates="candidate_profile")
    skills = relationship("Skill", secondary=candidate_skills, back_populates="candidates")
    experiences = relationship("Experience", back_populates="candidate", cascade="all, delete-orphan")
    educations = relationship("Education", back_populates="candidate", cascade="all, delete-orphan")
    abilities = relationship("Ability", back_populates="candidate", cascade="all, delete-orphan")
    resumes = relationship("UploadedResume", back_populates="candidate", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    candidates = relationship("Candidate", secondary=candidate_skills, back_populates="skills")


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    
    title = Column(String, index=True, nullable=True)
    firm = Column(String, index=True, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    candidate = relationship("Candidate", back_populates="experiences")


class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    
    institution = Column(String, index=True, nullable=True)
    degree = Column(String, index=True, nullable=True)
    specific_field = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    candidate = relationship("Candidate", back_populates="educations")


class Ability(Base):
    __tablename__ = "abilities"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    
    description = Column(Text, nullable=True)
    
    candidate = relationship("Candidate", back_populates="abilities")


class UploadedResume(Base):
    __tablename__ = "uploaded_resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    extracted_text = Column(Text, nullable=True)
    
    candidate = relationship("Candidate", back_populates="resumes")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    
    role = Column(String, nullable=True) # Role the interview was generated for
    date = Column(DateTime, default=datetime.utcnow)
    
    candidate = relationship("Candidate", backref="interviews")

class ExportHistory(Base):
    __tablename__ = "export_history"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="SET NULL"), nullable=True)
    
    candidate_name = Column(String)
    job_role = Column(String)
    action = Column(String) # e.g. "Exported as PDF"
    timestamp = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    query = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
