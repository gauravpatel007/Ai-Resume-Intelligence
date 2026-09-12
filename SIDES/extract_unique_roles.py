import os
import sys

# Add the backend directory to Python path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database.database import SessionLocal
from app.models.models import Experience

def main():
    print("Connecting to database...")
    db = SessionLocal()
    
    try:
        print("Querying unique job roles (this may take a few seconds)...")
        # Get all distinct titles
        roles = db.query(Experience.title).filter(Experience.title.isnot(None)).distinct().all()
        
        # Clean and sort them
        unique_roles = sorted(list(set([r[0].strip() for r in roles if r[0] and r[0].strip()])))
        
        output_file = "unique_job_roles.md"
        print(f"Found {len(unique_roles)} unique roles. Writing to {output_file}...")
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("# Unique Job Roles from Database\n\n")
            f.write(f"*Total unique roles: {len(unique_roles)}*\n\n")
            for role in unique_roles:
                f.write(f"- {role}\n")
                
        print(f"Success! Document created at: {os.path.abspath(output_file)}")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
