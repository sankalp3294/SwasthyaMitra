"""
Case management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Case, Patient, PatientSession, CaseEvent
from app.schemas import CaseCreate, CaseUpdate, CaseResponse, TriageRequest, TriageResponse
from app.api.deps import get_current_patient
from datetime import datetime
import json

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("/", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Create new case
    """
    # Verify patient
    patient = db.query(Patient).filter(Patient.id == current_session.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    case = Case(
        patient_id=current_session.patient_id,
        symptoms=case_data.symptoms,
        presenting_complaint=case_data.presenting_complaint,
        duration=case_data.duration,
        severity=case_data.severity,
        case_status="NEW"
    )
    
    db.add(case)
    db.flush()
    
    # Create audit event
    event = CaseEvent(
        case_id=case.id,
        event_type="case_created",
        event_data=json.dumps({"status": "new", "timestamp": datetime.utcnow().isoformat()}),
        created_by="patient"
    )
    db.add(event)
    db.commit()
    db.refresh(case)
    
    return case


@router.get("/patient/all")
async def get_patient_cases(
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get all cases for the current patient."""
    cases = db.query(Case).filter(Case.patient_id == current_session.patient_id).all()
    return {"cases": [CaseResponse.model_validate(c) for c in cases], "total": len(cases)}


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: int,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get case details
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Verify ownership
    if case.patient_id != current_session.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return case


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int,
    update_data: CaseUpdate,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Update case
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Verify ownership
    if case.patient_id != current_session.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(case, key, value)
    
    db.commit()
    db.refresh(case)
    
    return case


@router.post("/{case_id}/triage", response_model=TriageResponse)
async def triage_case(
    case_id: int,
    triage_request: TriageRequest,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Perform triage assessment
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    if case.patient_id != current_session.patient_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if triage_request.case_id != case_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Case ID does not match request path")
    
    # Simple triage logic based on symptoms
    symptoms_lower = (triage_request.symptoms or "").lower()
    
    # Keywords for urgency
    urgent_keywords = ["chest pain", "difficulty breathing", "unconscious", "severe bleeding", "emergency"]
    moderate_keywords = ["fever", "persistent cough", "vomiting", "diarrhea", "headache"]
    
    if any(keyword in symptoms_lower for keyword in urgent_keywords):
        triage_level = "URGENT"
        reasoning = "Potentially serious warning signs detected"
        recommendations = ["Seek immediate medical attention", "Call ambulance if necessary", "Go to emergency department"]
    elif any(keyword in symptoms_lower for keyword in moderate_keywords):
        triage_level = "MODERATE"
        reasoning = "Symptoms warrant higher-priority evaluation"
        recommendations = ["Schedule appointment within 24 hours", "Monitor symptoms closely", "Seek medical evaluation"]
    else:
        triage_level = "LOW"
        reasoning = "Routine pathway appropriate"
        recommendations = ["Schedule regular appointment", "Self-care measures may help", "Follow up if symptoms persist"]
    
    # Update case
    case.triage_level = triage_level
    case.case_status = "TRIAGED"
    db.add(case)
    
    # Log event
    event = CaseEvent(
        case_id=case.id,
        event_type="triage_assessment",
        event_data=json.dumps({
            "triage_level": triage_level,
            "reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }),
        created_by="system"
    )
    db.add(event)
    db.commit()
    
    return TriageResponse(
        triage_level=triage_level,
        reasoning=reasoning,
        recommendations=recommendations
    )
