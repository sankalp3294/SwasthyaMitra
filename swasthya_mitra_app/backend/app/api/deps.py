"""
Dependency functions for FastAPI
"""
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from app.database import get_db
from app.models import PatientSession, StaffCredential, User
from datetime import datetime


def get_current_session(
    session_token: str,
    db: Session = Depends(get_db)
) -> PatientSession:
    """
    Validate a verified patient or staff session.
    """
    patient_session = db.query(PatientSession).filter(
        PatientSession.session_token == session_token,
        PatientSession.is_verified == True,
        PatientSession.expires_at > datetime.utcnow()
    ).first()
    
    if not patient_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    return patient_session


def get_current_patient(
    patient_session: PatientSession = Depends(get_current_session),
) -> PatientSession:
    """Require a patient-linked session for patient-owned resources."""
    if not patient_session.patient_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access is required")
    return patient_session


def require_roles(*allowed_roles: str):
    """Create a dependency that permits only server-assigned staff roles."""
    def get_authorized_staff(
        patient_session: PatientSession = Depends(get_current_session),
        db: Session = Depends(get_db),
    ) -> User:
        credential = db.query(StaffCredential).filter(
            StaffCredential.email == patient_session.phone_number
        ).first()
        if not credential or not credential.user or credential.user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized for this action")
        return credential.user
    return get_authorized_staff
