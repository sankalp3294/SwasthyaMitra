"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ===== Patient Schemas =====
class PatientBase(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    health_id: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    medical_history: Optional[str] = None
    language_preference: str = "en"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_profile_complete: Optional[bool] = False


class PatientCreate(PatientBase):
    phone_number: str


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    medical_history: Optional[str] = None
    language_preference: Optional[str] = None
    location: Optional[str] = None
    is_profile_complete: Optional[bool] = None


class PatientResponse(PatientBase):
    id: int
    phone_number: str
    is_profile_complete: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class LabTestCreate(BaseModel):
    patient_id: int
    case_id: Optional[int] = None
    appointment_id: Optional[int] = None
    test_name: str
    test_category: Optional[str] = "General Lab"
    ordered_by: Optional[str] = None


class LabTestResponse(BaseModel):
    id: int
    patient_id: int
    case_id: Optional[int] = None
    appointment_id: Optional[int] = None
    test_name: str
    test_category: str
    status: str
    result_summary: Optional[str] = None
    result_notes: Optional[str] = None
    ordered_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== OTP/Session Schemas =====
class OTPRequest(BaseModel):
    phone_number: str


class OTPVerify(BaseModel):
    phone_number: str
    otp_code: str


class StaffLogin(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)


class SessionResponse(BaseModel):
    session_token: str
    expires_at: datetime
    patient_id: Optional[int] = None
    role: str = "patient"


# ===== Case Schemas =====
class CaseBase(BaseModel):
    symptoms: Optional[str] = None
    presenting_complaint: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[str] = None


class CaseCreate(CaseBase):
    patient_id: int


class CaseUpdate(BaseModel):
    symptoms: Optional[str] = None
    triage_level: Optional[str] = None
    case_status: Optional[str] = None
    notes: Optional[str] = None


class CaseResponse(CaseBase):
    id: int
    patient_id: int
    case_status: str
    triage_level: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== AI/NLP Schemas =====
class ConversationMessage(BaseModel):
    patient_id: int
    message: str
    language: Optional[str] = "en"


class AIResponse(BaseModel):
    message: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    extracted_entities: Optional[dict] = None
    next_action: Optional[str] = None


class TriageRequest(BaseModel):
    case_id: int
    symptoms: str


class TriageResponse(BaseModel):
    triage_level: str  # LOW, MODERATE, URGENT
    reasoning: str
    recommendations: List[str]


# ===== Hospital Schemas =====
class HospitalBase(BaseModel):
    name: str
    hospital_type: str
    address: str
    zone: str
    latitude: float
    longitude: float


class HospitalCreate(HospitalBase):
    district: Optional[str] = None
    state: Optional[str] = None
    phone_number: Optional[str] = None


class HospitalResponse(HospitalBase):
    id: int
    is_active: bool
    distance_km: Optional[float] = None
    emergency_beds_available: Optional[int] = 8
    phone_number: Optional[str] = "1800-108-0000"

    class Config:
        from_attributes = True


class HospitalSearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 10
    triage_level: Optional[str] = None


class HospitalSearchResponse(BaseModel):
    hospitals: List[HospitalResponse]
    nearest_distance_km: Optional[float] = None


# ===== Slot Schemas =====
class SlotBase(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str
    capacity: int


class SlotCreate(SlotBase):
    hospital_id: int


class SlotResponse(SlotBase):
    id: int
    hospital_id: int
    available_count: int

    class Config:
        from_attributes = True


# ===== Appointment Schemas =====
class AppointmentBase(BaseModel):
    appointment_date: str
    appointment_time: str


class AppointmentCreate(BaseModel):
    case_id: int
    patient_id: int
    hospital_id: int
    slot_id: int


class AppointmentUpdate(BaseModel):
    appointment_status: Optional[str] = None
    check_in_status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    case_id: int
    patient_id: int
    hospital_id: int
    appointment_date: str
    appointment_time: str
    appointment_status: str
    check_in_status: str
    no_show_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class CheckInRequest(BaseModel):
    appointment_id: int


class CheckInResponse(BaseModel):
    status: str
    check_in_time: datetime


class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str


class ConsultationRequest(BaseModel):
    diagnosis: str
    clinical_notes: Optional[str] = None
    medications: Optional[List[MedicationItem]] = []
    prescribed_tests: Optional[List[str]] = []
    referral: Optional[str] = None
    follow_up_date: Optional[str] = None


# ===== ASHA Schemas =====
class ASHAAssignmentResponse(BaseModel):
    id: int
    appointment_id: int
    asha_worker_id: int
    assignment_status: str
    assignment_reason: str
    follow_up_date: Optional[str] = None

    class Config:
        from_attributes = True


class ASHAFollowUpRequest(BaseModel):
    assignment_id: int
    follow_up_notes: str
    outcome: str


# ===== Analytics Schemas =====
class CommunitySignalResponse(BaseModel):
    id: int
    zone: str
    symptom_group: str
    observed_count: int
    baseline_count: int
    risk_level: str
    anomaly_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class ZoneAnalyticsResponse(BaseModel):
    zone: str
    total_cases: int
    critical_signals: List[CommunitySignalResponse]
    overall_risk: str


# ===== Chief Doctor Schemas =====
class InterventionRequest(BaseModel):
    signal_id: Optional[int] = None
    zone: str
    intervention_type: str
    decision_notes: str
    intervention_details: Optional[dict] = None


class InterventionResponse(BaseModel):
    id: int
    zone: str
    intervention_type: str
    decision: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Dashboard Schemas =====
class DashboardStatsResponse(BaseModel):
    total_patients: int
    total_cases: int
    pending_appointments: int
    attended_appointments: int
    critical_cases: int
    asha_assignments_pending: int


class CaseQueueItem(BaseModel):
    case_id: int
    patient_name: str
    symptoms: str
    triage_level: str
    created_at: datetime


class HospitalDashboardResponse(BaseModel):
    cases_queue: List[CaseQueueItem]
    today_appointments: List[AppointmentResponse]
    asha_assignments: List[ASHAAssignmentResponse]
    stats: DashboardStatsResponse


# ===== Error Schemas =====
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# ===== Medicine Inventory Schemas =====
class MedicineInventoryCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = "General Medicine"
    dosage_form: Optional[str] = "Tablet"
    strength: Optional[str] = None
    stock_quantity: int = 0
    reorder_level: Optional[int] = 50
    unit: Optional[str] = "tablets"
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    manufacturer: Optional[str] = None


class MedicineInventoryUpdate(BaseModel):
    name: Optional[str] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None


class MedicineInventoryResponse(BaseModel):
    id: int
    hospital_id: Optional[int] = None
    name: str
    generic_name: Optional[str] = None
    category: str
    dosage_form: str
    strength: Optional[str] = None
    stock_quantity: int
    reorder_level: int
    unit: str
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    manufacturer: Optional[str] = None
    is_essential: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Emergency Fast-Track Dispatch Schemas =====
class EmergencyDispatchCreate(BaseModel):
    phone_number: str
    patient_name: Optional[str] = "Emergency Patient"
    emergency_type: str = "Severe Chest Pain / Cardiac Emergency"
    location: Optional[str] = "Swasthya Nagar"
    notes: Optional[str] = None


class EmergencyDispatchResponse(BaseModel):
    success: bool = True
    emergency_pass_code: str
    patient_name: str
    phone_number: str
    hospital_id: int
    hospital_name: str
    hospital_address: str
    er_bay_number: str
    ambulance_unit: str
    ambulance_driver_contact: str
    eta_minutes: int
    assigned_doctor_name: str
    triage_level: str = "URGENT"
    status: str = "DISPATCHED"
    created_at: str


class EmergencyCancelRequest(BaseModel):
    emergency_pass_code: str


# ===== Lab Test Schemas =====
class LabTestCreate(BaseModel):
    patient_id: int
    test_name: str
    test_category: Optional[str] = "General Pathology"
    case_id: Optional[int] = None
    appointment_id: Optional[int] = None
    ordered_by: Optional[str] = "Attending Physician"


class LabTestResultUpdate(BaseModel):
    result_summary: str
    result_notes: Optional[str] = None
    status: str = "COMPLETED"


class LabTestResponse(BaseModel):
    id: int
    patient_id: int
    case_id: Optional[int] = None
    appointment_id: Optional[int] = None
    test_name: str
    test_category: str
    status: str
    result_summary: Optional[str] = None
    result_notes: Optional[str] = None
    ordered_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


