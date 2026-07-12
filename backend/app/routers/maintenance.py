from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.enums import MaintenanceStatus, UserRole
from app.models.maintenance import MaintenanceLog
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceOut,
    MaintenanceUpdate,
)
from app.services import maintenance_rules

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])

manager_only = require_role(UserRole.FLEET_MANAGER.value)


def _serialize(rec: MaintenanceLog) -> MaintenanceOut:
    return MaintenanceOut(
        id=rec.id,
        vehicle_id=rec.vehicle_id,
        description=rec.description,
        cost=rec.cost,
        status=rec.status,
        start_date=rec.start_date,
        end_date=rec.end_date,
        created_at=rec.created_at,
        vehicle_registration=rec.vehicle.registration_number if rec.vehicle else None,
        vehicle_name=rec.vehicle.name_model if rec.vehicle else None,
    )


@router.get("", response_model=list[MaintenanceOut])
def list_maintenance(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    vehicle_id: Optional[int] = None,
    status: Optional[str] = None,
):
    q = db.query(MaintenanceLog)
    if vehicle_id:
        q = q.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if status:
        q = q.filter(MaintenanceLog.status == status)
    records = q.order_by(MaintenanceLog.id.desc()).all()
    return [_serialize(r) for r in records]


@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def create_maintenance(
    body: MaintenanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(manager_only),
):
    vehicle = db.get(Vehicle, body.vehicle_id)
    if vehicle is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")

    rec_status = body.status or MaintenanceStatus.OPEN.value
    if rec_status == MaintenanceStatus.OPEN.value:
        maintenance_rules.ensure_can_open(vehicle)

    rec = MaintenanceLog(
        vehicle_id=body.vehicle_id,
        description=body.description,
        cost=body.cost,
        start_date=body.start_date or date.today(),
        status=rec_status,
    )
    db.add(rec)
    db.flush()
    maintenance_rules.sync_vehicle_status(db, vehicle)
    db.commit()
    db.refresh(rec)
    return _serialize(rec)


@router.patch("/{record_id}", response_model=MaintenanceOut)
def update_maintenance(
    record_id: int,
    body: MaintenanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(manager_only),
):
    rec = db.get(MaintenanceLog, record_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Maintenance record not found")
    vehicle = db.get(Vehicle, rec.vehicle_id)

    data = body.model_dump(exclude_unset=True)
    reopening = (
        data.get("status") == MaintenanceStatus.OPEN.value
        and rec.status != MaintenanceStatus.OPEN.value
    )
    if reopening and vehicle:
        maintenance_rules.ensure_can_open(vehicle)

    # Auto-stamp end_date when closing.
    if (
        data.get("status") == MaintenanceStatus.CLOSED.value
        and rec.status != MaintenanceStatus.CLOSED.value
        and "end_date" not in data
    ):
        rec.end_date = date.today()

    for field, value in data.items():
        setattr(rec, field, value)
    db.flush()
    if vehicle:
        maintenance_rules.sync_vehicle_status(db, vehicle)
    db.commit()
    db.refresh(rec)
    return _serialize(rec)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(manager_only),
):
    rec = db.get(MaintenanceLog, record_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Maintenance record not found")
    vehicle = db.get(Vehicle, rec.vehicle_id)
    db.delete(rec)
    db.flush()
    if vehicle:
        maintenance_rules.sync_vehicle_status(db, vehicle)
    db.commit()
