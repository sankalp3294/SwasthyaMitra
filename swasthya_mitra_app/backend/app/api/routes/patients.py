"""
Patient management API routes
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, PatientSession, Case, Appointment, LabTest, CaseEvent, User
from app.schemas import PatientResponse, PatientUpdate, LabTestCreate, LabTestResponse
from app.api.deps import get_current_patient, require_roles

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me", response_model=PatientResponse)
async def get_current_patient_profile(
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get current patient profile
    """
    patient = db.query(Patient).filter(Patient.id == current_session.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    if not patient.health_id:
        patient.health_id = f"SM-PAT-{patient.phone_number[-6:] if patient.phone_number else patient.id:06d}"
        db.commit()
        db.refresh(patient)
    return patient


@router.put("/me", response_model=PatientResponse)
async def update_patient_profile(
    update_data: PatientUpdate,
    current_session: PatientSession = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Update patient profile
    """
    patient = db.query(Patient).filter(Patient.id == current_session.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    # Ensure patient cannot manually overwrite medical_history from profile form
    update_dict.pop("medical_history", None)
    
    for key, value in update_dict.items():
        setattr(patient, key, value)
    
    if not patient.health_id:
        patient.health_id = f"SM-PAT-{patient.phone_number[-6:] if patient.phone_number else patient.id:06d}"
    
    # Mark profile complete when basic info is provided
    if patient.name and not patient.name.startswith("Patient ") and patient.age and patient.gender:
        patient.is_profile_complete = True
    elif "is_profile_complete" not in update_dict and patient.name:
        patient.is_profile_complete = True
    
    db.commit()
    db.refresh(patient)
    
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Get patient by ID
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    if not patient.health_id:
        patient.health_id = f"SM-PAT-{patient.phone_number[-6:] if patient.phone_number else patient.id:06d}"
        db.commit()
        db.refresh(patient)
    return patient


@router.get("/{patient_id}/medical-file")
async def get_patient_full_medical_file(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete paperless digital health record (Health ID, history, diagnoses, prescriptions, lab tests).
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    # Ensure patient has a health_id
    if not patient.health_id:
        patient.health_id = f"SM-PAT-{patient.phone_number[-6:] if patient.phone_number else patient.id:06d}"
        db.commit()
        db.refresh(patient)
    
    cases = db.query(Case).filter(Case.patient_id == patient_id).all()
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.appointment_date.desc()).all()
    lab_tests = db.query(LabTest).filter(LabTest.patient_id == patient_id).order_by(LabTest.created_at.desc()).all()
    
    # Process appointments to parse JSON consultation notes if present
    consultation_history = []
    for appt in appointments:
        consultation_data = None
        if appt.notes and appt.notes.startswith('{'):
            try:
                consultation_data = json.loads(appt.notes)
            except Exception:
                pass
        
        consultation_history.append({
            "appointment_id": appt.id,
            "case_id": appt.case_id,
            "hospital_id": appt.hospital_id,
            "hospital_name": appt.hospital.name if appt.hospital else "PHC Clinic",
            "date": appt.appointment_date,
            "time": appt.appointment_time,
            "status": appt.appointment_status,
            "consultation_details": consultation_data
        })

    return {
        "patient": PatientResponse.model_validate(patient),
        "total_visits": len(appointments),
        "total_cases": len(cases),
        "consultations": consultation_history,
        "lab_tests": [LabTestResponse.model_validate(lt) for lt in lab_tests]
    }


@router.post("/{patient_id}/lab-tests", response_model=LabTestResponse)
async def create_lab_test(
    patient_id: int,
    test_data: LabTestCreate,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Order a lab test for a patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        
    lab_test = LabTest(
        patient_id=patient_id,
        case_id=test_data.case_id,
        appointment_id=test_data.appointment_id,
        test_name=test_data.test_name,
        test_category=test_data.test_category or "General Lab",
        ordered_by=test_data.ordered_by or "Doctor",
        status="ORDERED"
    )
    db.add(lab_test)
    db.commit()
    db.refresh(lab_test)
    return lab_test


@router.put("/lab-tests/{test_id}/results", response_model=LabTestResponse)
async def record_lab_test_results(
    test_id: int,
    result_data: dict,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Record lab test results"""
    lab_test = db.query(LabTest).filter(LabTest.id == test_id).first()
    if not lab_test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab test not found")
        
    lab_test.status = "COMPLETED"
    lab_test.result_summary = result_data.get("result_summary", "")
    lab_test.result_notes = result_data.get("result_notes", "")
    
    db.commit()
    db.refresh(lab_test)
    return lab_test
