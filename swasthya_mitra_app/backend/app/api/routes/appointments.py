"""
Appointment management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import (
    Appointment, Case, Patient, Hospital, Slot, 
    PatientSession, ASHAAssignment, ASHAWorker, CaseEvent, User, LabTest
)
from app.schemas import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, 
    CheckInRequest, CheckInResponse, ASHAAssignmentResponse,
    ConsultationRequest
)
from app.api.deps import get_current_patient, require_roles
from datetime import datetime
import json

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Create appointment booking
    """
    if appointment_data.patient_id != current_session.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access denied"
        )

    # Verify case ownership
    case = db.query(Case).filter(Case.id == appointment_data.case_id).first()
    if not case or case.patient_id != current_session.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Case access denied"
        )
    
    # Check slot availability
    slot = db.query(Slot).filter(Slot.id == appointment_data.slot_id).first()
    if not slot or slot.available_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot not available"
        )
    if slot.hospital_id != appointment_data.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected slot does not belong to this hospital"
        )
    
    # Check for duplicate active appointment
    existing = db.query(Appointment).filter(
        and_(
            Appointment.case_id == appointment_data.case_id,
            Appointment.appointment_status.in_(["REQUESTED", "CONFIRMED"])
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active appointment already exists for this case"
        )
    
    # Create appointment
    appointment = Appointment(
        case_id=appointment_data.case_id,
        patient_id=current_session.patient_id,
        hospital_id=appointment_data.hospital_id,
        slot_id=appointment_data.slot_id,
        appointment_date=slot.date,
        appointment_time=slot.start_time,
        appointment_status="REQUESTED"
    )
    
    db.add(appointment)
    db.flush()
    
    # Decrease slot availability
    slot.available_count -= 1
    db.add(slot)
    
    # Log event
    event = CaseEvent(
        case_id=appointment_data.case_id,
        event_type="appointment_requested",
        event_data=json.dumps({
            "hospital_id": appointment_data.hospital_id,
            "timestamp": datetime.utcnow().isoformat()
        }),
        created_by="patient"
    )
    db.add(event)
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.get("/patient/all")
async def get_patient_appointments(
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get all appointments for the current patient."""
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == current_session.patient_id
    ).order_by(Appointment.appointment_date, Appointment.appointment_time).all()
    return {"appointments": [AppointmentResponse.model_validate(a) for a in appointments], "total": len(appointments)}


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get appointment details
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify ownership
    if appointment.patient_id != current_session.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Update appointment (admin/doctor)
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(appointment, key, value)
    
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.post("/{appointment_id}/confirm", response_model=AppointmentResponse)
async def confirm_appointment(
    appointment_id: int,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Confirm appointment
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment.appointment_status = "CONFIRMED"
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.post("/{appointment_id}/check-in", response_model=CheckInResponse)
async def check_in(
    appointment_id: int,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Check in for appointment
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    check_in_time = datetime.utcnow()
    appointment.check_in_status = "CHECKED_IN"
    appointment.check_in_time = check_in_time
    appointment.appointment_status = "ATTENDED"
    db.commit()
    
    return CheckInResponse(
        status="success",
        check_in_time=check_in_time
    )


@router.post("/{appointment_id}/consultation")
async def record_consultation(
    appointment_id: int,
    consultation: ConsultationRequest,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Record clinical consultation notes, prescriptions, referral, and follow-up
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Package consultation payload
    prescribed_tests_list = [t.strip() for t in (consultation.prescribed_tests or []) if t.strip()]
    consultation_data = {
        "diagnosis": consultation.diagnosis,
        "clinical_notes": consultation.clinical_notes,
        "medications": [m.dict() for m in consultation.medications or []],
        "prescribed_tests": prescribed_tests_list,
        "referral": consultation.referral,
        "follow_up_date": consultation.follow_up_date,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    appointment.check_in_status = "CHECKED_IN"
    appointment.appointment_status = "COMPLETED"
    appointment.notes = json.dumps(consultation_data)
    
    # Create LabTest records for each prescribed diagnostic test
    for test_name in prescribed_tests_list:
        db.add(LabTest(
            patient_id=appointment.patient_id,
            case_id=appointment.case_id,
            appointment_id=appointment.id,
            test_name=test_name,
            test_category="Prescribed Diagnostic Test",
            ordered_by="Doctor",
            status="ORDERED"
        ))
    
    # Update linked Case
    if appointment.case_id:
        case = db.query(Case).filter(Case.id == appointment.case_id).first()
        if case:
            case.case_status = "COMPLETED" if not consultation.follow_up_date else "FOLLOW_UP_SCHEDULED"
            case.notes = f"Diagnosis: {consultation.diagnosis}. Notes: {consultation.clinical_notes or 'N/A'}"
            
            # Add audit event
            event = CaseEvent(
                case_id=case.id,
                event_type="doctor_consultation",
                event_data=json.dumps(consultation_data),
                created_by="doctor"
            )
            db.add(event)
    
    db.commit()
    db.refresh(appointment)
    
    return {
        "status": "success",
        "appointment_id": appointment.id,
        "appointment_status": appointment.appointment_status,
        "consultation": consultation_data,
        "message": "Consultation recorded successfully"
    }


@router.post("/{appointment_id}/no-show")
async def mark_no_show(
    appointment_id: int,
    no_show_data: dict = None,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Mark appointment as no-show (Doctor decides whether to dispatch ASHA worker)
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    no_show_data = no_show_data or {}
    dispatch_asha = no_show_data.get("dispatch_asha", False)
    asha_worker_id = no_show_data.get("asha_worker_id")
    asha_instructions = no_show_data.get("asha_instructions", "")

    appointment.check_in_status = "NO_SHOW"
    appointment.no_show_count += 1
    
    if dispatch_asha:
        appointment.appointment_status = "ASHA_ESCALATION"
        asha_w = db.query(ASHAWorker).filter(ASHAWorker.id == asha_worker_id).first() if asha_worker_id else db.query(ASHAWorker).filter(ASHAWorker.is_active == True).first()
        asha_worker_id = asha_w.id if asha_w else None

        reason = f"Doctor Dispatched ASHA Visit: {asha_instructions or 'Follow up missed appointment.'}"
        asha_assignment = ASHAAssignment(
            appointment_id=appointment.id,
            asha_worker_id=asha_worker_id,
            case_id=appointment.case_id,
            assignment_reason=reason[:95],
            assignment_status="ASSIGNED",
            follow_up_notes=asha_instructions or "Check patient health and verify reason for missed appointment."
        )
        db.add(asha_assignment)

        # Dispatch SMS Alert to ASHA Worker
        if asha_w and asha_w.phone_number:
            from app.services.sms_service import SMSService
            SMSService.send_asha_dispatch_sms(
                asha_w.phone_number,
                asha_w.name,
                str(appointment.patient_id),
                asha_instructions or "Urgent home visit assigned by Doctor"
            )
    else:
        appointment.appointment_status = f"NO_SHOW_{appointment.no_show_count}"
    
    db.commit()
    db.refresh(appointment)
    
    return {
        "status": "success",
        "no_show_count": appointment.no_show_count,
        "appointment_status": appointment.appointment_status,
        "dispatch_asha": dispatch_asha,
        "message": "Appointment marked as no-show successfully"
    }


@router.post("/{appointment_id}/rebook")
async def rebook_appointment(
    appointment_id: int,
    rebook_data: dict = None,
    db: Session = Depends(get_db)
):
    """
    Rebook appointment after a missed / no-show appointment
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    rebook_data = rebook_data or {}
    new_slot_id = rebook_data.get("new_slot_id")

    if new_slot_id:
        new_slot = db.query(Slot).filter(Slot.id == new_slot_id).first()
    else:
        # Automatically find next available slot at the same hospital
        new_slot = db.query(Slot).filter(
            Slot.hospital_id == appointment.hospital_id,
            Slot.available_count > 0
        ).order_by(Slot.date.asc(), Slot.start_time.asc()).first()

    if not new_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available appointment slots found to rebook. Please contact the hospital."
        )

    old_slot_id = appointment.slot_id
    if old_slot_id and old_slot_id != new_slot.id:
        old_slot = db.query(Slot).filter(Slot.id == old_slot_id).first()
        if old_slot:
            old_slot.available_count += 1

    new_slot.available_count = max(0, new_slot.available_count - 1)

    appointment.slot_id = new_slot.id
    appointment.appointment_date = new_slot.date
    appointment.appointment_time = new_slot.start_time
    appointment.appointment_status = "CONFIRMED"
    appointment.check_in_status = "PENDING"
    
    db.commit()
    db.refresh(appointment)
    
    return {
        "status": "success",
        "appointment_id": appointment.id,
        "new_date": appointment.appointment_date,
        "new_time": appointment.appointment_time,
        "message": f"Appointment successfully rebooked for {appointment.appointment_date} at {appointment.appointment_time}."
    }
