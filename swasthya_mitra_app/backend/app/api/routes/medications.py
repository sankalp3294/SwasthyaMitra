"""
Medicine Inventory & Hospital Pharmacy API routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MedicineInventory, User
from app.schemas import MedicineInventoryCreate, MedicineInventoryResponse, MedicineInventoryUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/medications", tags=["medications"])


@router.get("", response_model=List[MedicineInventoryResponse])
@router.get("/", response_model=List[MedicineInventoryResponse])
async def list_medications(
    search: Optional[str] = Query(None, description="Search by medicine name or generic name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    stock_status: Optional[str] = Query(None, description="Filter: IN_STOCK, LOW_STOCK, OUT_OF_STOCK"),
    db: Session = Depends(get_db)
):
    """
    Get complete medication inventory list for doctors and hospital pharmacy
    """
    query = db.query(MedicineInventory)
    
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (MedicineInventory.name.ilike(search_pattern)) | 
            (MedicineInventory.generic_name.ilike(search_pattern))
        )
    
    if category:
        query = query.filter(MedicineInventory.category == category)
        
    items = query.order_by(MedicineInventory.name.asc()).all()
    
    if stock_status:
        if stock_status == "IN_STOCK":
            items = [item for item in items if item.stock_quantity > item.reorder_level]
        elif stock_status == "LOW_STOCK":
            items = [item for item in items if 0 < item.stock_quantity <= item.reorder_level]
        elif stock_status == "OUT_OF_STOCK":
            items = [item for item in items if item.stock_quantity == 0]
            
    return [MedicineInventoryResponse.model_validate(item) for item in items]


@router.post("", response_model=MedicineInventoryResponse)
@router.post("/", response_model=MedicineInventoryResponse)
async def add_medication(
    med_data: MedicineInventoryCreate,
    _staff: User = Depends(require_roles("pharmacist", "doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Add a new medicine to hospital inventory"""
    item = MedicineInventory(
        name=med_data.name,
        generic_name=med_data.generic_name,
        category=med_data.category or "General Medicine",
        dosage_form=med_data.dosage_form or "Tablet",
        strength=med_data.strength,
        stock_quantity=med_data.stock_quantity,
        reorder_level=med_data.reorder_level or 50,
        unit=med_data.unit or "tablets",
        batch_number=med_data.batch_number,
        expiry_date=med_data.expiry_date,
        manufacturer=med_data.manufacturer
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return MedicineInventoryResponse.model_validate(item)


@router.put("/{med_id}", response_model=MedicineInventoryResponse)
async def update_medication_stock(
    med_id: int,
    update_data: MedicineInventoryUpdate,
    _staff: User = Depends(require_roles("pharmacist", "doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Update stock quantity or details of a medicine"""
    item = db.query(MedicineInventory).filter(MedicineInventory.id == med_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine item not found")
        
    update_dict = update_data.dict(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(item, k, v)
        
    db.commit()
    db.refresh(item)
    return MedicineInventoryResponse.model_validate(item)


@router.post("/dispense/{med_id}")
async def dispense_medication(
    med_id: int,
    quantity: int = Query(1, ge=1),
    _staff: User = Depends(require_roles("pharmacist", "doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Dispense medicine to patient and decrement stock quantity"""
    item = db.query(MedicineInventory).filter(MedicineInventory.id == med_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine item not found")
    
    if item.stock_quantity < quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock. Available: {item.stock_quantity}")
    
    item.stock_quantity -= quantity
    db.commit()
    db.refresh(item)
    return {
        "status": "DISPENSED",
        "medicine_id": item.id,
        "name": item.name,
        "quantity_dispensed": quantity,
        "remaining_stock": item.stock_quantity,
        "is_low_stock": item.stock_quantity <= item.reorder_level
    }


@router.delete("/{med_id}")
async def delete_medication(
    med_id: int,
    _staff: User = Depends(require_roles("pharmacist", "doctor", "chief_doctor", "admin")),
    db: Session = Depends(get_db)
):
    """Delete a medicine from inventory"""
    item = db.query(MedicineInventory).filter(MedicineInventory.id == med_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine item not found")
        
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Medicine removed from inventory"}
