"""
Dashboards API routes for different roles
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Case, Appointment, ASHAAssignment, Hospital, CommunitySignal, 
    Intervention, AuditLog, Doctor, ASHAWorker, User
)
from app.schemas import DashboardStatsResponse, CaseQueueItem, HospitalDashboardResponse
from datetime import datetime, timedelta
from app.api.deps import require_roles

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.get("/stats")
async def get_system_stats(db: Session = Depends(get_db)):
    """
    Get system-wide statistics
    """
    total_patients = db.query(func.count(Case.patient_id.distinct())).scalar() or 0
    total_cases = db.query(func.count(Case.id)).scalar() or 0
    pending_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.appointment_status == "REQUESTED"
    ).scalar() or 0
    attended_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.appointment_status == "ATTENDED"
    ).scalar() or 0
    critical_cases = db.query(func.count(Case.id)).filter(
        Case.triage_level == "URGENT"
    ).scalar() or 0
    asha_assignments_pending = db.query(func.count(ASHAAssignment.id)).filter(
        ASHAAssignment.assignment_status == "ASSIGNED"
    ).scalar() or 0
    
    return DashboardStatsResponse(
        total_patients=total_patients,
        total_cases=total_cases,
        pending_appointments=pending_appointments,
        attended_appointments=attended_appointments,
        critical_cases=critical_cases,
        asha_assignments_pending=asha_assignments_pending
    )


@router.get("/hospital/{hospital_id}")
async def get_hospital_dashboard(
    hospital_id: int,
    _staff: User = Depends(require_roles("doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get hospital dashboard with cases queue and appointments
    """
    # Get cases queue
    cases = db.query(Case).filter(
        Case.case_status.in_(["AI_ASSESSED", "TRIAGED"])
    ).all()
    
    cases_queue = []
    for case in cases:
        if case.patient:
            cases_queue.append(CaseQueueItem(
                case_id=case.id,
                patient_name=case.patient.name,
                symptoms=case.presenting_complaint or "",
                triage_level=case.triage_level or "UNKNOWN",
                created_at=case.created_at
            ))
    
    # Get today's appointments
    today = datetime.utcnow().date()
    today_appointments = db.query(Appointment).filter(
        Appointment.hospital_id == hospital_id,
        Appointment.appointment_date == str(today)
    ).all()
    
    # Get ASHA assignments
    asha_assignments = db.query(ASHAAssignment).filter(
        ASHAAssignment.assignment_status == "ASSIGNED"
    ).all()
    
    # Get stats
    stats = DashboardStatsResponse(
        total_patients=len(set([a.patient_id for a in today_appointments])),
        total_cases=len(cases_queue),
        pending_appointments=len([a for a in today_appointments if a.appointment_status == "REQUESTED"]),
        attended_appointments=len([a for a in today_appointments if a.appointment_status == "ATTENDED"]),
        critical_cases=len([c for c in cases if c.triage_level == "URGENT"]),
        asha_assignments_pending=len([a for a in asha_assignments if a.assignment_status == "ASSIGNED"])
    )
    
    return HospitalDashboardResponse(
        cases_queue=cases_queue,
        today_appointments=today_appointments,
        asha_assignments=asha_assignments,
        stats=stats
    )


@router.get("/chief-doctor")
async def get_chief_doctor_dashboard(_staff: User = Depends(require_roles("chief_doctor", "admin")), db: Session = Depends(get_db)):
    """
    Get Chief Doctor dashboard with patient treatment metrics, hospital breakdown, signals, and interventions
    """
    # Get critical signals
    critical_signals = db.query(CommunitySignal).filter(
        CommunitySignal.risk_level.in_(["ORANGE", "RED"])
    ).all()
    
    # Get pending interventions
    pending_interventions = db.query(Intervention).filter(
        Intervention.decision == "PENDING"
    ).all()
    
    # Get recent interventions
    recent_interventions = db.query(Intervention).order_by(
        Intervention.created_at.desc()
    ).limit(10).all()
    
    # Group signals by zone
    zones_at_risk = {}
    for signal in critical_signals:
        if signal.zone not in zones_at_risk:
            zones_at_risk[signal.zone] = []
        zones_at_risk[signal.zone].append(signal)
    
    # Fetch Patient Treatment Metrics across District
    all_appointments = db.query(Appointment).all()
    all_hospitals = db.query(Hospital).all()

    # Total patients who visited hospitals
    visited_patient_ids = set([a.patient_id for a in all_appointments if a.patient_id])
    total_patients_visited = len(visited_patient_ids)

    # Treated and Completed patients
    treated_patient_ids = set([
        a.patient_id for a in all_appointments 
        if a.patient_id and (a.appointment_status == "COMPLETED" or a.check_in_status == "CHECKED_IN")
    ])
    total_patients_treated = len(treated_patient_ids)

    # Currently in treatment or scheduled follow-up
    in_treatment_patient_ids = set([
        a.patient_id for a in all_appointments 
        if a.patient_id and a.appointment_status in ["REQUESTED", "CONFIRMED", "ATTENDED"]
    ])
    total_patients_in_treatment = len(in_treatment_patient_ids)

    # Hospital-wise patient breakdown
    hospital_stats = []
    for hosp in all_hospitals:
        hosp_appts = [a for a in all_appointments if a.hospital_id == hosp.id]
        hosp_visited = len(set([a.patient_id for a in hosp_appts if a.patient_id]))
        hosp_treated = len(set([a.patient_id for a in hosp_appts if a.patient_id and (a.appointment_status == "COMPLETED" or a.check_in_status == "CHECKED_IN")]))
        hosp_in_treatment = len(set([a.patient_id for a in hosp_appts if a.patient_id and a.appointment_status in ["REQUESTED", "CONFIRMED", "ATTENDED"]]))
        
        hospital_stats.append({
            "id": hosp.id,
            "name": hosp.name,
            "type": hosp.hospital_type,
            "zone": hosp.zone,
            "total_visited": hosp_visited,
            "total_treated": hosp_treated,
            "in_treatment": hosp_in_treatment
        })

    # Doctor Performance & Patient Breakdown across District
    all_doctors = db.query(Doctor).all()
    doctor_stats = []
    for doc in all_doctors:
        doc_appts = [a for a in all_appointments if a.doctor_id == doc.id or (a.hospital_id == doc.hospital_id)]
        
        # Treated (COMPLETED)
        treated_appts = [a for a in doc_appts if a.appointment_status == "COMPLETED"]
        treated_count = len(set([a.patient_id for a in treated_appts if a.patient_id]))
        
        # Currently in treatment
        in_treatment_appts = [a for a in doc_appts if a.appointment_status in ["REQUESTED", "CONFIRMED", "ATTENDED"]]
        in_treatment_count = len(set([a.patient_id for a in in_treatment_appts if a.patient_id]))
        
        patient_details = []
        for appt in doc_appts:
            if appt.patient:
                patient_details.append({
                    "appointment_id": appt.id,
                    "patient_id": appt.patient_id,
                    "patient_name": appt.patient.name,
                    "health_id": appt.patient.health_id or f"SM-PAT-{appt.patient_id:06d}",
                    "appointment_date": appt.appointment_date,
                    "status": appt.appointment_status,
                    "notes": appt.notes
                })

        doctor_stats.append({
            "id": doc.id,
            "name": doc.name,
            "qualification": doc.qualification,
            "specialization": doc.specialization,
            "registration_number": doc.registration_number,
            "hospital_name": doc.hospital.name if doc.hospital else "PHC Clinic",
            "department_name": doc.department.name if doc.department else "General OPD",
            "treated_count": treated_count,
            "in_treatment_count": in_treatment_count,
            "total_handled": len(doc_appts),
            "patients": patient_details
        })

    # Aggregated zone-level public health data for GIS Map & Analytics Charts
    zone_dict = {}
    for hosp in all_hospitals:
        z = hosp.zone or "Swasthya Nagar"
        if z not in zone_dict:
            zone_dict[z] = {
                "zone_name": z,
                "hospitals_count": 0,
                "total_visited": 0,
                "total_treated": 0,
                "in_treatment": 0,
                "risk_level": "GREEN",
                "top_symptom": "Seasonal Fever / Flu",
                "latitude": hosp.latitude or 28.6139,
                "longitude": hosp.longitude or 77.2090
            }
        zone_dict[z]["hospitals_count"] += 1

    for appt in all_appointments:
        if appt.hospital and appt.hospital.zone:
            z = appt.hospital.zone
            if z in zone_dict:
                zone_dict[z]["total_visited"] += 1
                if appt.appointment_status == "COMPLETED":
                    zone_dict[z]["total_treated"] += 1
                elif appt.appointment_status in ["REQUESTED", "CONFIRMED", "ATTENDED"]:
                    zone_dict[z]["in_treatment"] += 1

    for signal in critical_signals:
        z = signal.zone
        if z in zone_dict:
            zone_dict[z]["risk_level"] = signal.risk_level
            zone_dict[z]["top_symptom"] = signal.symptom_group

    zone_analytics = list(zone_dict.values())

    return {
        "critical_signals": critical_signals,
        "zones_at_risk": zones_at_risk,
        "pending_interventions": pending_interventions,
        "recent_interventions": recent_interventions,
        "total_zones_monitoring": len(zone_dict),
        "total_patients_visited": total_patients_visited,
        "total_patients_treated": total_patients_treated,
        "total_patients_in_treatment": total_patients_in_treatment,
        "hospital_stats": hospital_stats,
        "doctor_stats": doctor_stats,
        "zone_analytics": zone_analytics
    }


@router.get("/asha-worker/{worker_id}")
async def get_asha_dashboard(
    worker_id: int,
    _staff: User = Depends(require_roles("asha", "admin", "chief_doctor")),
    db: Session = Depends(get_db)
):
    """
    Get ASHA worker dashboard with assigned cases
    """
    assignments = db.query(ASHAAssignment).filter(
        ASHAAssignment.asha_worker_id == worker_id
    ).all()
    
    pending_assignments = [a for a in assignments if a.assignment_status == "ASSIGNED"]
    completed_assignments = [a for a in assignments if a.assignment_status == "COMPLETED"]
    
    return {
        "worker_id": worker_id,
        "total_assignments": len(assignments),
        "pending_assignments": len(pending_assignments),
        "completed_assignments": len(completed_assignments),
        "assignments": pending_assignments,
        "completion_rate": len(completed_assignments) / len(assignments) if assignments else 0
    }


@router.get("/doctor/me")
async def get_my_doctor_dashboard(
    staff: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    """Operational queue for the authenticated doctor."""
    doctor = db.query(Doctor).filter(Doctor.user_id == staff.id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    appointments = db.query(Appointment).filter(
        (Appointment.doctor_id == doctor.id) | (Appointment.hospital_id == doctor.hospital_id)
    ).order_by(Appointment.appointment_date, Appointment.appointment_time).all()
    return {"doctor": doctor, "appointments": appointments, "pending_count": len([a for a in appointments if a.appointment_status in ["REQUESTED", "CONFIRMED"]])}


@router.get("/asha/me")
async def get_my_asha_dashboard(
    staff: User = Depends(require_roles("asha")),
    db: Session = Depends(get_db),
):
    """Assigned follow-up queue for the authenticated ASHA worker."""
    worker = db.query(ASHAWorker).filter(ASHAWorker.user_id == staff.id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASHA worker profile not found")
    assignments = db.query(ASHAAssignment).filter(ASHAAssignment.asha_worker_id == worker.id).all()
    return {"worker": worker, "assignments": assignments, "pending_count": len([a for a in assignments if a.assignment_status == "ASSIGNED"])}


@router.get("/audit")
async def get_audit_logs(
    limit: int = 100,
    entity_type: str = None,
    db: Session = Depends(get_db)
):
    """
    Get audit logs
    """
    query = db.query(AuditLog)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    return {
        "logs": logs,
        "total": len(logs)
    }
