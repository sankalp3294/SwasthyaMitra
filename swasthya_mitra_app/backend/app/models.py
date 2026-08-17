from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, Enum, DECIMAL
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class User(Base):
    """User base model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), unique=True, index=True)
    role = Column(String(50), default="patient")  # patient, doctor, asha, admin, chief_doctor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patients = relationship("Patient", back_populates="user")
    doctors = relationship("Doctor", back_populates="user")
    asha_workers = relationship("ASHAWorker", back_populates="user")


class Patient(Base):
    """Patient model"""
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    health_id = Column(String(50), unique=True, index=True)  # Unique Digital Health ID (e.g. SM-PAT-10001)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)
    medical_history = Column(Text, nullable=True)
    language_preference = Column(String(50), default="en")
    location = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    phone_number = Column(String(20), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="patients")
    cases = relationship("Case", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    sessions = relationship("PatientSession", back_populates="patient")
    lab_tests = relationship("LabTest", back_populates="patient")


class PatientSession(Base):
    """Patient OTP/Session management"""
    __tablename__ = "patient_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    phone_number = Column(String(20), index=True)
    otp_code = Column(String(6))
    otp_attempts = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    session_token = Column(String(500), unique=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="sessions")


class StaffCredential(Base):
    """Credentials for staff accounts; patient access remains OTP-only."""
    __tablename__ = "staff_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class Case(Base):
    """Patient case/visit model"""
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    case_status = Column(String(50), default="NEW")  # NEW, AI_ASSESSED, TRIAGED, APPOINTMENT_REQUESTED, etc.
    symptoms = Column(Text)  # JSON: structured symptom data
    presenting_complaint = Column(Text)
    duration = Column(String(100))
    severity = Column(String(20))  # mild, moderate, severe
    triage_level = Column(String(20))  # LOW, MODERATE, URGENT
    ai_confidence = Column(Float)
    extracted_entities = Column(Text)  # JSON: NER output
    conversation_history = Column(Text)  # JSON: chat history
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="cases")
    appointments = relationship("Appointment", back_populates="case")
    events = relationship("CaseEvent", back_populates="case")


class CaseEvent(Base):
    """Case event log"""
    __tablename__ = "case_events"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    event_type = Column(String(100))  # ai_assessment, triage, appointment_requested, etc.
    event_data = Column(Text)  # JSON
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="events")


class Hospital(Base):
    """Government hospital/PHC model"""
    __tablename__ = "hospitals"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    hospital_type = Column(String(100))  # PHC, CHC, District Hospital, etc.
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(Text)
    zone = Column(String(100), index=True)
    district = Column(String(100))
    state = Column(String(100))
    phone_number = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    departments = relationship("Department", back_populates="hospital")
    doctors = relationship("Doctor", back_populates="hospital")
    slots = relationship("Slot", back_populates="hospital")


class Department(Base):
    """Hospital department"""
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String(255))  # General Medicine, Pediatrics, etc.
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    hospital = relationship("Hospital", back_populates="departments")
    doctors = relationship("Doctor", back_populates="department")


class Doctor(Base):
    """Doctor model"""
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    name = Column(String(255))
    qualification = Column(String(255))
    specialization = Column(String(255))
    registration_number = Column(String(100))
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="doctors")
    hospital = relationship("Hospital", back_populates="doctors")
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class Slot(Base):
    """Appointment slot"""
    __tablename__ = "slots"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    date = Column(String(20))  # YYYY-MM-DD
    start_time = Column(String(20))  # HH:MM
    end_time = Column(String(20))
    capacity = Column(Integer, default=5)
    available_count = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    
    hospital = relationship("Hospital", back_populates="slots")
    appointments = relationship("Appointment", back_populates="slot")


class Appointment(Base):
    """Appointment booking"""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    slot_id = Column(Integer, ForeignKey("slots.id"))
    appointment_status = Column(String(50), default="REQUESTED")  # REQUESTED, CONFIRMED, ATTENDED, NO_SHOW, REBOOKED, etc.
    appointment_date = Column(String(20))
    appointment_time = Column(String(20))
    check_in_status = Column(String(50), default="PENDING")  # PENDING, CHECKED_IN, NO_SHOW
    check_in_time = Column(DateTime, nullable=True)
    notes = Column(Text)
    no_show_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    case = relationship("Case", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    hospital = relationship("Hospital")
    doctor = relationship("Doctor", back_populates="appointments")
    slot = relationship("Slot", back_populates="appointments")
    asha_assignments = relationship("ASHAAssignment", back_populates="appointment")


class ASHAWorker(Base):
    """ASHA (Accredited Social Health Activist) worker"""
    __tablename__ = "asha_workers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255))
    phone_number = Column(String(20))
    zone = Column(String(100), index=True)
    assigned_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="asha_workers")
    assignments = relationship("ASHAAssignment", back_populates="asha_worker")


class ASHAAssignment(Base):
    """ASHA assignment for follow-up"""
    __tablename__ = "asha_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    asha_worker_id = Column(Integer, ForeignKey("asha_workers.id"))
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    assignment_reason = Column(String(100))  # SECOND_NO_SHOW, FOLLOW_UP_REQUIRED, etc.
    assignment_status = Column(String(50), default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, COMPLETED
    follow_up_date = Column(String(20))
    follow_up_notes = Column(Text)
    outcome = Column(String(100))  # VISITED, NOT_REACHABLE, REFERRED, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    appointment = relationship("Appointment", back_populates="asha_assignments")
    asha_worker = relationship("ASHAWorker", back_populates="assignments")
    case = relationship("Case")


class CommunitySignal(Base):
    """Zone-level symptom signals for community health"""
    __tablename__ = "community_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    zone = Column(String(100), index=True)
    symptom_group = Column(String(255), index=True)  # fever, cough, etc.
    observed_count = Column(Integer, default=0)
    baseline_count = Column(Integer, default=0)
    time_window_start = Column(String(20))
    time_window_end = Column(String(20))
    anomaly_score = Column(Float, default=0.0)
    severity_indicators = Column(Text)  # JSON
    risk_level = Column(String(20), default="GREEN")  # GREEN, YELLOW, ORANGE, RED
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Intervention(Base):
    """Chief Doctor interventions"""
    __tablename__ = "interventions"
    
    id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(Integer, nullable=True)
    zone = Column(String(100))
    intervention_type = Column(String(100))  # MONITOR, INVESTIGATE, DEPLOY_TEAM, HEALTH_CAMP, PUBLIC_ADVISORY
    decision = Column(String(50))  # APPROVED, REJECTED, PENDING
    authorized_by = Column(String(100))  # Chief Doctor/authority
    decision_notes = Column(Text)
    intervention_details = Column(Text)  # JSON: camp details, team info, etc.
    start_date = Column(String(20))
    end_date = Column(String(20), nullable=True)
    outcomes = Column(Text)  # JSON
    status = Column(String(50), default="PLANNED")  # PLANNED, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    """Audit trail for sensitive operations"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255))
    entity_type = Column(String(100))  # Case, Appointment, etc.
    entity_id = Column(Integer)
    performed_by = Column(String(255), nullable=True)
    old_value = Column(Text)  # JSON
    new_value = Column(Text)  # JSON
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LabTest(Base):
    """Lab test order and result model"""
    __tablename__ = "lab_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    test_name = Column(String(255), nullable=False)
    test_category = Column(String(100), default="General Lab")  # Blood Test, Pathology, Imaging, etc.
    status = Column(String(50), default="ORDERED")  # ORDERED, COMPLETED
    result_summary = Column(Text, nullable=True)  # e.g. "Hb: 13.5 g/dL (Normal)"
    result_notes = Column(Text, nullable=True)
    ordered_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="lab_tests")
    case = relationship("Case")
    appointment = relationship("Appointment")


class MedicineInventory(Base):
    """Hospital Pharmacy Medicine Inventory Model"""
    __tablename__ = "medicine_inventory"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    category = Column(String(100), default="General Medicine")
    dosage_form = Column(String(50), default="Tablet")  # Tablet, Capsule, Syrup, Injection, Ointment
    strength = Column(String(50), nullable=True)  # e.g. 500mg, 10ml, 40mg
    stock_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=50)
    unit = Column(String(20), default="units")  # tablets, capsules, bottles, vials
    batch_number = Column(String(100), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    manufacturer = Column(String(255), nullable=True)
    is_essential = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospital = relationship("Hospital")
