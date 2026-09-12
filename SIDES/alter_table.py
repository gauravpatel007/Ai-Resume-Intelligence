import os
import sys
from sqlalchemy import text
from backend.app.database.database import SessionLocal

def alter_db():
    db = SessionLocal()
    try:
        print("Adding total_experience_years...")
        db.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS total_experience_years FLOAT DEFAULT 0.0;"))
        print("Adding highest_degree_level...")
        db.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS highest_degree_level INTEGER DEFAULT 0;"))
        db.commit()
        print("Columns added successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    alter_db()
