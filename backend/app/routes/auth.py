import os
import json
import secrets
import urllib.request
import urllib.error
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database.database import get_db
from ..models.models import User, Candidate
from ..schemas.user import UserCreate, UserResponse, Token, GoogleAuthRequest, ForgotPasswordRequest, ResetPasswordRequest
from ..utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_otp_reset_token,
    verify_otp_reset_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..utils.email import send_password_reset_email


router = APIRouter(prefix="/api/auth", tags=["auth"])

def verify_google_token(credential: str) -> dict:
    """
    Verifies a Google OAuth ID token using Google's official tokeninfo API.
    """
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        req = urllib.request.Request(url, headers={"User-Agent": "AIResumeIntelligence/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google credential token"
                )
            data = json.loads(response.read().decode("utf-8"))
            
        if data.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token issuer"
            )
            
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if google_client_id and google_client_id.strip() and not google_client_id.startswith("your-"):
            if data.get("aud") != google_client_id.strip():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token audience mismatch"
                )
                
        email_verified = data.get("email_verified")
        if email_verified is False or email_verified == "false":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account email is not verified"
            )
            
        return data
    except urllib.error.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google token with Google servers"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication error: {str(e)}"
        )


@router.post("/register", response_model=UserResponse)
def register_candidate(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    
    # Create the User (always "candidate" from public endpoint)
    new_user = User(email=user.email, password_hash=hashed_password, role="candidate")
    db.add(new_user)
    db.flush() # Flush to get the new_user.id without committing the transaction
    
    # Create the Candidate profile linked to the user
    new_candidate = Candidate(user_id=new_user.id, name=user.name, email=user.email)
    db.add(new_candidate)
    db.commit() # Atomic commit for both
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "candidate" and not current_user.candidate_profile:
        cand = db.query(Candidate).filter(Candidate.email == current_user.email).first()
        if cand:
            cand.user_id = current_user.id
            db.commit()
            db.refresh(current_user)
    return current_user


@router.post("/google", response_model=Token)
def google_auth(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    payload = verify_google_token(auth_data.credential)
    
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not return an email address"
        )
    email = email.lower().strip()
    name = payload.get("name") or payload.get("given_name") or email.split("@")[0]
    
    # 1. Check if user already exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create brand new user with candidate role
        random_pwd = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_pwd)
        user = User(email=email, password_hash=hashed_password, role="candidate")
        db.add(user)
        db.flush()
        
        # Initialize Candidate profile
        candidate = Candidate(user_id=user.id, name=name, email=email)
        db.add(candidate)
        db.commit()
        db.refresh(user)
    else:
        # Self-heal candidate profile if missing
        if user.role == "candidate" and not user.candidate_profile:
            candidate = Candidate(user_id=user.id, name=name, email=email)
            db.add(candidate)
            db.commit()
            
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    
    # Generic success message for privacy/security
    if not user:
        return {
            "status": "success",
            "message": "If an account exists with this email address, a password reset code has been sent."
        }
        
    candidate_name = user.candidate_profile.name if user.candidate_profile else ""
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    hashed_code = get_password_hash(code)
    reset_session_token = create_otp_reset_token(user.email, hashed_code)
    
    try:
        send_password_reset_email(to_email=user.email, code=code, recipient_name=candidate_name)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send password reset email: {str(e)}"
        )
        
    return {
        "status": "success",
        "message": "If an account exists with this email address, a password reset code has been sent.",
        "reset_session_token": reset_session_token
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = verify_otp_reset_token(req.reset_session_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset session is invalid or has expired."
        )
        
    email = payload["email"]
    code_hash = payload["code_hash"]
    
    if not verify_password(req.code, code_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    
    return {
        "status": "success",
        "message": "Your password has been successfully reset. You can now log in with your new password."
    }
