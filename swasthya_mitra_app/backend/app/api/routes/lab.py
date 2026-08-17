"""
Path Lab API routes for ordering and uploading test results
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LabTest, Patient, Case, User
from app.schemas import LabTestCreate, LabTestResultUpdate, LabTestResponse
from app.api.deps import require_roles, get_current_patient
from datetime import datetime

router = APIRouter(prefix="/lab", tags=["path_lab"])


@router.get("/tests", response_model=List[LabTestResponse])
async def list_lab_tests(
    patient_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List lab test orders for Pathology Lab & Doctors"""
    query = db.query(LabTest)
    if patient_id:
        query = query.filter(LabTest.patient_id == patient_id)
    if status_filter:
        query = query.filter(LabTest.status == status_filter)
    if category:
        query = query.filter(LabTest.test_category == category)
        
    tests = query.order_by(LabTest.created_at.desc()).all()
    return [LabTestResponse.model_validate(t) for t in tests]


@router.post("/tests", response_model=LabTestResponse)
@router.post("/tests/create", response_model=LabTestResponse)
async def create_lab_test(
    test_data: LabTestCreate,
    _staff: User = Depends(require_roles("lab_technician", "doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Order/Create a new lab test for a patient"""
    patient = db.query(Patient).filter(Patient.id == test_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    lab_test = LabTest(
        patient_id=test_data.patient_id,
        case_id=test_data.case_id,
        appointment_id=test_data.appointment_id,
        test_name=test_data.test_name,
        test_category=test_data.test_category or "General Pathology",
        status="ORDERED",
        ordered_by=test_data.ordered_by or "Attending Physician"
    )
    db.add(lab_test)
    db.commit()
    db.refresh(lab_test)
    return LabTestResponse.model_validate(lab_test)


@router.post("/tests/{test_id}/upload-result", response_model=LabTestResponse)
@router.put("/tests/{test_id}/result", response_model=LabTestResponse)
async def upload_lab_test_result(
    test_id: int,
    result_data: LabTestResultUpdate,
    _staff: User = Depends(require_roles("lab_technician", "doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Upload and update lab test results & findings"""
    lab_test = db.query(LabTest).filter(LabTest.id == test_id).first()
    if not lab_test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab test not found")

    lab_test.result_summary = result_data.result_summary
    lab_test.result_notes = result_data.result_notes
    lab_test.status = result_data.status or "COMPLETED"
    
    db.commit()
    db.refresh(lab_test)
    return LabTestResponse.model_validate(lab_test)


@router.get("/tests/patient/me")
async def get_my_lab_tests(
    current_session = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get lab test results for authenticated patient"""
    tests = db.query(LabTest).filter(LabTest.patient_id == current_session.patient_id).order_by(LabTest.created_at.desc()).all()
    return [LabTestResponse.model_validate(t) for t in tests]
