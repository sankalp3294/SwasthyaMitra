"""
ASHA worker management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from datetime import datetime, timedelta
from app.models import ASHAWorker, ASHAAssignment, Appointment, Hospital, User
from app.schemas import ASHAAssignmentResponse
from app.api.deps import require_roles

router = APIRouter(prefix="/asha", tags=["asha"])


@router.get("/assignments")
async def get_asha_assignments(_staff: User = Depends(require_roles("asha", "admin", "chief_doctor")), db: Session = Depends(get_db)):
    """
    Get all ASHA assignments
    """
    assignments = db.query(ASHAAssignment).all()
    return {"assignments": [ASHAAssignmentResponse.model_validate(a) for a in assignments], "total": len(assignments)}


@router.get("/assignments/{assignment_id}", response_model=ASHAAssignmentResponse)
async def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """
    Get ASHA assignment details
    """
    assignment = db.query(ASHAAssignment).filter(ASHAAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return assignment


@router.post("/assignments/{assignment_id}/submit-followup")
async def submit_followup(
    assignment_id: int,
    followup_data: dict,
    _staff: User = Depends(require_roles("asha", "admin", "chief_doctor")),
    db: Session = Depends(get_db)
):
    """
    Submit ASHA follow-up report (supports photo upload, false complaint flagging, and appointment booking)
    """
    assignment = db.query(ASHAAssignment).filter(ASHAAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    notes = followup_data.get("notes", "")
    outcome = followup_data.get("outcome", "VISITED")
    photo_url = followup_data.get("photo_url", "")
    is_false_complaint = followup_data.get("is_false_complaint", False)
    flag_reason = followup_data.get("flag_reason", "")
    book_appointment = followup_data.get("book_appointment", False)
    appointment_date = followup_data.get("appointment_date", "")

    if is_false_complaint:
        outcome = "FALSE_COMPLAINT_FLAGGED"
        notes = f"⚠️ [FALSE COMPLAINT FLAGGED]: {flag_reason} | {notes}"

    if photo_url:
        notes = f"{notes} | 📸 [Field Photo Attached]"

    assignment.follow_up_notes = notes
    assignment.outcome = outcome
    assignment.assignment_status = "COMPLETED"
    assignment.follow_up_date = datetime.utcnow().strftime("%Y-%m-%d")

    # If ASHA worker requested doctor appointment booking for patient
    new_appt_id = None
    if book_appointment and assignment.case:
        patient_id = assignment.case.patient_id
        hosp = db.query(Hospital).first()
        hosp_id = hosp.id if hosp else 1
        
        appt_date = appointment_date or (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
        new_appt = Appointment(
            patient_id=patient_id,
            hospital_id=hosp_id,
            appointment_date=appt_date,
            appointment_status="CONFIRMED",
            check_in_status="PENDING",
            notes=f"Scheduled by ASHA Worker during home visit. Reason: {notes[:120]}"
        )
        db.add(new_appt)
        db.flush()
        new_appt_id = new_appt.id
    
    db.commit()
    db.refresh(assignment)
    
    return {
        "status": "success",
        "assignment_id": assignment_id,
        "outcome": assignment.outcome,
        "new_appointment_id": new_appt_id,
        "message": "ASHA field report submitted successfully"
    }


@router.get("/workers")
async def get_asha_workers(_staff: User = Depends(require_roles("doctor", "admin", "chief_doctor")), db: Session = Depends(get_db)):
    """
    Get all ASHA workers
    """
    workers = db.query(ASHAWorker).all()
    return {"workers": workers, "total": len(workers)}


@router.get("/workers/{worker_id}")
async def get_asha_worker(worker_id: int, db: Session = Depends(get_db)):
    """
    Get ASHA worker details
    """
    worker = db.query(ASHAWorker).filter(ASHAWorker.id == worker_id).first()
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ASHA worker not found"
        )
    
    assignments = db.query(ASHAAssignment).filter(
        ASHAAssignment.asha_worker_id == worker_id
    ).all()
    
    return {
        "worker": worker,
        "assignments": assignments,
        "active_assignments": len([a for a in assignments if a.assignment_status == "ASSIGNED"])
    }


@router.get("/workers/{worker_id}/assignments")
async def get_worker_assignments(worker_id: int, db: Session = Depends(get_db)):
    """
    Get assignments for a specific ASHA worker
    """
    assignments = db.query(ASHAAssignment).filter(
        ASHAAssignment.asha_worker_id == worker_id
    ).all()
    
    return {
        "worker_id": worker_id,
        "assignments": assignments,
        "total": len(assignments),
        "pending": len([a for a in assignments if a.assignment_status == "ASSIGNED"])
    }


@router.post("/workers/create")
async def create_asha_worker(worker_data: dict, _staff: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    """
    Create new ASHA worker (admin)
    """
    worker = ASHAWorker(
        name=worker_data["name"],
        phone_number=worker_data["phone_number"],
        zone=worker_data["zone"],
        is_active=True
    )
    
    db.add(worker)
    db.commit()
    db.refresh(worker)
    
    return {
        "status": "success",
        "worker_id": worker.id,
        "message": "ASHA worker created successfully"
    }
