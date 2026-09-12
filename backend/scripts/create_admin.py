import os
import sys
import getpass

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import SessionLocal, Base, engine
from app.models.models import User
from app.utils.auth import get_password_hash

def create_admin():
    print("=== Create Admin User ===")
    email = "admin@gmail.com"
    password = "admin"
        
    session = SessionLocal()
    try:
        existing = session.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "admin"
            existing.password_hash = get_password_hash(password)
            session.commit()
            print(f"✅ User {email} was already registered, upgraded to 'admin' with password '{password}'!")
            return
            
        hashed_pw = get_password_hash(password)
        admin_user = User(email=email, password_hash=hashed_pw, role="admin")
        
        session.add(admin_user)
        session.commit()
        print(f"✅ Admin user {email} created successfully!")
    except Exception as e:
        session.rollback()
        print(f"Error creating admin: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    create_admin()
