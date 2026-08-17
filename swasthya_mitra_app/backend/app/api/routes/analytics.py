"""
Analytics and community health API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Case, CommunitySignal, Intervention, User
from app.schemas import CommunitySignalResponse, InterventionRequest, InterventionResponse, ZoneAnalyticsResponse
from app.config import get_settings
from app.api.deps import require_roles
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/analytics", tags=["analytics"])
settings = get_settings()


@router.get("/zones")
async def get_zones(db: Session = Depends(get_db)):
    """
    Get list of all zones
    """
    zones = db.query(func.distinct(CommunitySignal.zone)).all()
    return {"zones": [zone[0] for zone in zones if zone[0]]}


@router.get("/zones/{zone}/signals")
async def get_zone_signals(
    zone: str,
    db: Session = Depends(get_db)
):
    """
    Get community signals for a zone
    """
    signals = db.query(CommunitySignal).filter(
        CommunitySignal.zone == zone
    ).all()
    
    return {
        "zone": zone,
        "signals": signals,
        "critical_count": len([s for s in signals if s.risk_level in ["ORANGE", "RED"]])
    }


@router.get("/zones/{zone}/analytics", response_model=ZoneAnalyticsResponse)
async def get_zone_analytics(
    zone: str,
    db: Session = Depends(get_db)
):
    """
    Get zone-level analytics and risk assessment
    """
    # Get all signals for the zone
    signals = db.query(CommunitySignal).filter(
        CommunitySignal.zone == zone
    ).all()
    
    # Get total cases
    total_cases = db.query(func.count(Case.id)).scalar() or 0
    
    # Determine overall risk
    risk_levels = [s.risk_level for s in signals]
    if "RED" in risk_levels:
        overall_risk = "RED"
    elif "ORANGE" in risk_levels:
        overall_risk = "ORANGE"
    elif "YELLOW" in risk_levels:
        overall_risk = "YELLOW"
    else:
        overall_risk = "GREEN"
    
    return ZoneAnalyticsResponse(
        zone=zone,
        total_cases=total_cases,
        critical_signals=signals,
        overall_risk=overall_risk
    )


@router.post("/signals/detect")
async def detect_anomalies(_staff: User = Depends(require_roles("chief_doctor", "admin")), db: Session = Depends(get_db)):
    """
    Run anomaly detection on aggregated case data (admin)
    """
    if not settings.cluster_detection_enabled:
        return {"status": "disabled"}
    
    # Get cases from the baseline period
    baseline_start = datetime.utcnow() - timedelta(days=settings.zone_baseline_period_days)
    
    cases = db.query(Case).all()
    
    # Simple aggregation by zone and symptom
    zone_symptom_counts = {}
    for case in cases:
        if case.patient and case.patient.location:
            zone = case.patient.location
            symptoms = case.presenting_complaint or "unknown"
            key = (zone, symptoms)
            zone_symptom_counts[key] = zone_symptom_counts.get(key, 0) + 1
    
    # Generate signals
    signals_created = 0
    for (zone, symptom_group), count in zone_symptom_counts.items():
        # Simple anomaly: if count > 5, flag as increased
        baseline = 2
        anomaly_score = (count - baseline) / baseline if baseline > 0 else 0
        
        if anomaly_score > 0.5:
            risk_level = "ORANGE" if count > 10 else "YELLOW"
        else:
            risk_level = "GREEN"
        
        signal = CommunitySignal(
            zone=zone,
            symptom_group=symptom_group,
            observed_count=count,
            baseline_count=baseline,
            anomaly_score=min(anomaly_score, 1.0),
            risk_level=risk_level,
            confidence=0.7,
            time_window_start=(datetime.utcnow() - timedelta(days=7)).isoformat(),
            time_window_end=datetime.utcnow().isoformat()
        )
        db.add(signal)
        signals_created += 1
    
    db.commit()
    
    return {
        "status": "success",
        "signals_created": signals_created,
        "message": f"Detected anomalies and created {signals_created} signals"
    }


@router.get("/signals")
async def get_all_signals(db: Session = Depends(get_db)):
    """
    Get all community signals
    """
    signals = db.query(CommunitySignal).all()
    return {"signals": [CommunitySignalResponse.model_validate(s) for s in signals], "total": len(signals)}


@router.post("/interventions", response_model=InterventionResponse)
async def create_intervention(
    request: InterventionRequest,
    _staff: User = Depends(require_roles("chief_doctor")),
    db: Session = Depends(get_db)
):
    """
    Create intervention (Chief Doctor)
    """
    intervention = Intervention(
        signal_id=request.signal_id,
        zone=request.zone,
        intervention_type=request.intervention_type,
        authorized_by="chief_doctor",
        decision_notes=request.decision_notes,
        intervention_details=json.dumps(request.intervention_details or {}),
        start_date=datetime.utcnow().strftime("%Y-%m-%d"),
        decision="APPROVED"
    )
    
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    
    return intervention


@router.get("/interventions")
async def get_interventions(db: Session = Depends(get_db)):
    """
    Get all interventions
    """
    interventions = db.query(Intervention).all()
    return {"interventions": interventions, "total": len(interventions)}


@router.get("/interventions/{intervention_id}", response_model=InterventionResponse)
async def get_intervention(intervention_id: int, db: Session = Depends(get_db)):
    """
    Get intervention details
    """
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention not found"
        )
    return intervention


@router.put("/interventions/{intervention_id}", response_model=InterventionResponse)
async def update_intervention(
    intervention_id: int,
    update_data: dict,
    _staff: User = Depends(require_roles("chief_doctor")),
    db: Session = Depends(get_db)
):
    """
    Update intervention outcome
    """
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention not found"
        )
    
    if "status" in update_data:
        intervention.status = update_data["status"]
    if "outcomes" in update_data:
        intervention.outcomes = json.dumps(update_data["outcomes"])
    if "end_date" in update_data:
        intervention.end_date = update_data["end_date"]
    
    db.commit()
    db.refresh(intervention)
    
    return intervention
