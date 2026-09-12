import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import engine, Base
from app.models.models import User, Candidate, Skill, Experience, Education, Ability, UploadedResume, candidate_skills

def reset_database():
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Recreating all tables with updated schemas...")
    Base.metadata.create_all(bind=engine)
    
    print("Database has been successfully reset! You can now run import_dataset.py")

if __name__ == "__main__":
    reset_database()
