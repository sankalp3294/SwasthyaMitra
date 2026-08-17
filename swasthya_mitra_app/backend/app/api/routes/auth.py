"""
Patient authentication and session management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Patient, PatientSession, StaffCredential, User
from app.schemas import OTPRequest, OTPVerify, SessionResponse, PatientCreate, PatientResponse, StaffLogin
from app.utils.passwords import verify_password
from app.config import get_settings
import random
import string
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def generate_session_token() -> str:
    """Generate secure session token"""
    return secrets.token_urlsafe(32)


@router.post("/request-otp", response_model=dict)
async def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """
    Request OTP for phone number verification
    """
    phone_number = request.phone_number
    
    # Check if patient exists or create new
    patient = db.query(Patient).filter(Patient.phone_number == phone_number).first()
    
    # Generate OTP
    otp_code = generate_otp()
    
    # Create or update session
    session = db.query(PatientSession).filter(
        PatientSession.phone_number == phone_number,
        PatientSession.is_verified == False
    ).first()
    
    if session:
        session.otp_code = otp_code
        session.otp_attempts = 0
        session.expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
    else:
        session = PatientSession(
            phone_number=phone_number,
            otp_code=otp_code,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
        )
    
    db.add(session)
    db.commit()
    
    # Send OTP via External SMS Service
    from app.services.sms_service import SMSService
    SMSService.send_otp_sms(phone_number, otp_code)
    
    return {
        "status": "success",
        "message": "OTP sent successfully",
        "otp": otp_code,
        "expires_in_minutes": settings.otp_expiry_minutes
    }


@router.post("/verify-otp", response_model=SessionResponse)
async def verify_otp(request: OTPVerify, db: Session = Depends(get_db)):
    """
    Verify OTP and generate session token
    """
    session = db.query(PatientSession).filter(
        PatientSession.phone_number == request.phone_number,
        PatientSession.is_verified == False
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP session not found"
        )
    
    if session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired"
        )
    
    if session.otp_attempts >= settings.max_otp_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP attempts exceeded"
        )
    
    if session.otp_code != request.otp_code:
        session.otp_attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # OTP verified
    session.is_verified = True
    session.session_token = generate_session_token()
    session.expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Ensure user and patient exist for the logged-in phone number
    user = db.query(User).filter(User.phone_number == request.phone_number).first()
    if not user:
        user = User(phone_number=request.phone_number, role="patient")
        db.add(user)
        db.flush()

    patient = db.query(Patient).filter(Patient.phone_number == request.phone_number).first()
    if not patient and user.role == "patient":
        patient = Patient(
            user_id=user.id,
            health_id=f"SM-PAT-{request.phone_number[-6:]}",
            phone_number=request.phone_number,
            name=f"Patient {request.phone_number[-4:]}"  # Default display name
        )
        db.add(patient)
        db.flush()
    
    session.patient_id = patient.id if patient else None
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return SessionResponse(
        session_token=session.session_token,
        expires_at=session.expires_at,
        patient_id=patient.id if patient else None,
        role=user.role
    )


@router.post("/staff/login", response_model=SessionResponse)
async def staff_login(request: StaffLogin, db: Session = Depends(get_db)):
    """Sign in a staff member. Patient accounts cannot use this endpoint."""
    credential = db.query(StaffCredential).filter(
        StaffCredential.email == request.email.strip().lower()
    ).first()
    if not credential or not verify_password(request.password, credential.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user = credential.user
    if not user.is_active or user.role not in {"doctor", "chief_doctor", "admin", "asha"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not authorized for staff access")

    session = PatientSession(
        phone_number=credential.email,
        is_verified=True,
        session_token=generate_session_token(),
        expires_at=datetime.utcnow() + timedelta(hours=12),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse(session_token=session.session_token, expires_at=session.expires_at, patient_id=None, role=user.role)


@router.post("/register", response_model=PatientResponse)
async def register_patient(
    request: PatientCreate,
    db: Session = Depends(get_db)
):
    """
    Register new patient
    """
    # Check if patient already exists
    existing_patient = db.query(Patient).filter(
        Patient.phone_number == request.phone_number
    ).first()
    
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient already registered"
        )
    
    # Create user
    user = User(phone_number=request.phone_number, role="patient")
    db.add(user)
    db.flush()
    
    # Create patient
    patient = Patient(
        user_id=user.id,
        phone_number=request.phone_number,
        name=request.name,
        age=request.age,
        gender=request.gender,
        language_preference=request.language_preference,
        location=request.location,
        latitude=request.latitude,
        longitude=request.longitude
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return patient


@router.post("/logout")
async def logout(session_token: str, db: Session = Depends(get_db)):
    """
    Logout patient
    """
    session = db.query(PatientSession).filter(
        PatientSession.session_token == session_token
    ).first()
    
    if session:
        session.is_verified = False
        db.commit()
    
    return {"status": "success", "message": "Logged out successfully"}
