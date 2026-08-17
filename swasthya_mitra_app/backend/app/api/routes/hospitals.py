"""
Hospital and slot management API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import Hospital, Department, Slot, Appointment
from app.schemas import HospitalResponse, SlotResponse, HospitalSearchResponse, HospitalSearchRequest
import math

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    """
    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


@router.get("", response_model=List[HospitalResponse])
@router.get("/", response_model=List[HospitalResponse])
async def list_hospitals(db: Session = Depends(get_db)):
    """
    List all active hospitals
    """
    hospitals = db.query(Hospital).filter(Hospital.is_active == True).all()
    return hospitals


@router.post("/search", response_model=HospitalSearchResponse)
async def search_hospitals(
    search_request: HospitalSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for hospitals by location and distance
    """
    hospitals = db.query(Hospital).filter(Hospital.is_active == True).all()
    
    # Filter by distance
    nearby_hospitals = []
    for hospital in hospitals:
        if hospital.latitude and hospital.longitude:
            distance = calculate_distance(
                search_request.latitude,
                search_request.longitude,
                hospital.latitude,
                hospital.longitude
            )
            
            if distance <= search_request.radius_km:
                nearby_hospitals.append({
                    "hospital": hospital,
                    "distance": distance
                })
    
    # Sort by distance
    nearby_hospitals.sort(key=lambda x: x["distance"])
    
    # Convert to response
    nearest_distance = nearby_hospitals[0]["distance"] if nearby_hospitals else None
    hospital_responses = [item["hospital"] for item in nearby_hospitals]
    
    return HospitalSearchResponse(
        hospitals=hospital_responses,
        nearest_distance_km=nearest_distance
    )


@router.get("/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(hospital_id: int, db: Session = Depends(get_db)):
    """
    Get hospital details
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    return hospital


@router.get("/{hospital_id}/departments")
async def get_hospital_departments(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    """
    Get departments of a hospital
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    departments = db.query(Department).filter(Department.hospital_id == hospital_id).all()
    return {"hospital_id": hospital_id, "departments": departments}


@router.get("/{hospital_id}/slots")
async def get_hospital_slots(
    hospital_id: int,
    date: str = None,
    db: Session = Depends(get_db)
):
    """
    Get available slots for a hospital
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    query = db.query(Slot).filter(
        and_(
            Slot.hospital_id == hospital_id,
            Slot.is_active == True,
            Slot.available_count > 0
        )
    )
    
    if date:
        query = query.filter(Slot.date == date)
    
    slots = query.all()
    return {"hospital_id": hospital_id, "slots": [SlotResponse.model_validate(s) for s in slots]}


@router.post("/{hospital_id}/slots/create")
async def create_slots(
    hospital_id: int,
    slots_data: dict,
    db: Session = Depends(get_db)
):
    """
    Create appointment slots for a hospital (admin)
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    created_slots = []
    for slot_data in slots_data.get("slots", []):
        slot = Slot(
            hospital_id=hospital_id,
            date=slot_data["date"],
            start_time=slot_data["start_time"],
            end_time=slot_data["end_time"],
            capacity=slot_data.get("capacity", 5),
            available_count=slot_data.get("capacity", 5)
        )
        db.add(slot)
        created_slots.append(slot)
    
    db.commit()
    
    return {
        "status": "success",
        "message": f"Created {len(created_slots)} slots",
        "slots": created_slots
    }
