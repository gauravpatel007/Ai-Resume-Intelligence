import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import SessionLocal
from sqlalchemy import text

def fix_sequences():
    print("=== Fixing PostgreSQL Sequences ===")
    session = SessionLocal()
    try:
        # PostgreSQL specific query to update the auto-increment sequence 
        # to the max id + 1, since we manually imported data with explicit IDs.
        query = text("SELECT setval(pg_get_serial_sequence('candidates', 'id'), coalesce(max(id),0) + 1, false) FROM candidates;")
        session.execute(query)
        session.commit()
        print("✅ Candidate ID sequence fixed successfully!")
    except Exception as e:
        print(f"Error fixing sequence: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    fix_sequences()
