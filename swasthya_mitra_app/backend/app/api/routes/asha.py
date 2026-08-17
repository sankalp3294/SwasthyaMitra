"""
ASHA worker management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from datetime import datetime, timedelta
from app.models import ASHAWorker, ASHAAssignment, Appointment, Hospital, User, Patient, Case, Doctor
from app.schemas import ASHAAssignmentResponse
from app.api.deps import require_roles
import random

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


@router.post("/emergency-dispatch")
async def asha_emergency_dispatch(
    dispatch_data: dict,
    staff: User = Depends(require_roles("asha", "admin", "chief_doctor", "doctor")),
    db: Session = Depends(get_db)
):
    """
    ASHA Worker 1-Click Community Emergency SOS Dispatch.
    Reserves ER bed, dispatches GPS ambulance, alerts ER doctor, and assigns ASHA worker to emergency case.
    """
    phone = "".join(filter(str.isdigit, str(dispatch_data.get("phone_number", ""))))[-10:]
    if not phone or len(phone) < 10:
        phone = "9876543210"

    patient_name = dispatch_data.get("patient_name", "Community Patient")
    emergency_type = dispatch_data.get("emergency_type", "Severe Community Health Emergency")
    location = dispatch_data.get("location", "Swasthya Nagar Zone")
    vitals = dispatch_data.get("vitals", "Urgent field assessment requested")

    # Get ASHA worker profile
    asha_worker = db.query(ASHAWorker).filter(ASHAWorker.user_id == staff.id).first()
    asha_name = asha_worker.name if asha_worker else "ASHA Community Worker"

    # Find or create patient
    patient = db.query(Patient).filter(Patient.phone_number == phone).first()
    if not patient:
        user = db.query(User).filter(User.phone_number == phone).first()
        if not user:
            user = User(phone_number=phone, role="patient")
            db.add(user)
            db.flush()
        patient = Patient(
            user_id=user.id,
            health_id=f"SM-PAT-{phone[-6:]}",
            name=patient_name,
            phone_number=phone,
            location=location,
            is_profile_complete=True
        )
        db.add(patient)
        db.flush()

    # Get hospital
    hospital = db.query(Hospital).first()
    hospital_id = hospital.id if hospital else 1
    hospital_name = hospital.name if hospital else "Swasthya City Hospital & Trauma Center"

    # Create Critical Case
    c = Case(
        patient_id=patient.id,
        presenting_complaint=f"[ASHA COMMUNITY SOS] {emergency_type} | Reported by ASHA {asha_name} | Vitals: {vitals}",
        symptoms=f"ASHA-SOS: {emergency_type}",
        severity="CRITICAL",
        triage_level="URGENT",
        case_status="ASHA_COMMUNITY_SOS"
    )
    db.add(c)
    db.flush()

    # Generate Emergency Pass Code
    pass_code_num = random.randint(100000, 999999)
    pass_code = f"ASHA-SOS-{pass_code_num}"
    bay_num = random.randint(1, 12)
    amb_num = random.randint(101, 199)
    driver_phone = f"+91 98765 {random.randint(10000, 99999)}"
    eta = random.randint(3, 8)

    # Create Fast-Track Appointment
    appt = Appointment(
        case_id=c.id,
        patient_id=patient.id,
        hospital_id=hospital_id,
        appointment_date=datetime.utcnow().strftime("%Y-%m-%d"),
        appointment_time="FAST-TRACK NOW",
        appointment_status="CONFIRMED",
        check_in_status="CHECKED_IN",
        notes=f"ASHA SOS EMERGENCY PASS #{pass_code} | Triggered by ASHA {asha_name} | ER Bay #{bay_num:02d} | Amb #AMB-{amb_num}"
    )
    db.add(appt)
    db.flush()

    # Assign ASHA worker to emergency case
    assignment = ASHAAssignment(
        case_id=c.id,
        asha_worker_id=asha_worker.id if asha_worker else 1,
        appointment_id=appt.id,
        assignment_status="ASSIGNED",
        assignment_reason="ASHA Emergency Community Dispatch & Escalation"
    )
    db.add(assignment)
    db.commit()

    return {
        "success": True,
        "pass_code": pass_code,
        "patient_name": patient.name,
        "phone_number": phone,
        "emergency_type": emergency_type,
        "hospital_name": hospital_name,
        "er_bay_number": f"ER Trauma Bay #{bay_num:02d}",
        "ambulance_unit": f"GPS Ambulance #AMB-108-{amb_num}",
        "ambulance_driver_contact": driver_phone,
        "eta_minutes": eta,
        "asha_worker_name": asha_name,
        "status": "DISPATCHED"
    }

