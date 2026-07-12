from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.enums import UserRole
from app.models.fuel import FuelLog
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.fuel import FuelCreate, FuelOut

router = APIRouter(prefix="/api/fuel", tags=["fuel"])

# Financial Analysts and Fleet Managers record fuel; everyone can read.
finance_admin = require_role(
    UserRole.FINANCIAL_ANALYST.value, UserRole.FLEET_MANAGER.value
)


def _serialize(rec: FuelLog) -> FuelOut:
    return FuelOut(
        id=rec.id,
        vehicle_id=rec.vehicle_id,
        trip_id=rec.trip_id,
        liters=rec.liters,
        cost=rec.cost,
        odometer=rec.odometer,
        date=rec.date,
        created_at=rec.created_at,
        vehicle_registration=rec.vehicle.registration_number if rec.vehicle else None,
        vehicle_name=rec.vehicle.name_model if rec.vehicle else None,
    )


@router.get("", response_model=list[FuelOut])
def list_fuel(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    vehicle_id: Optional[int] = None,
):
    q = db.query(FuelLog)
    if vehicle_id:
        q = q.filter(FuelLog.vehicle_id == vehicle_id)
    return [_serialize(r) for r in q.order_by(FuelLog.id.desc()).all()]


@router.post("", response_model=FuelOut, status_code=status.HTTP_201_CREATED)
def create_fuel(
    body: FuelCreate,
    db: Session = Depends(get_db),
    _: User = Depends(finance_admin),
):
    if db.get(Vehicle, body.vehicle_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    rec = FuelLog(**body.model_dump())
    if rec.date is None:
        rec.date = date.today()
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _serialize(rec)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fuel(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(finance_admin),
):
    rec = db.get(FuelLog, record_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fuel log not found")
    db.delete(rec)
    db.commit()
