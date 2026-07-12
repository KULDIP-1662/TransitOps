from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.enums import UserRole, VehicleStatus
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleOut, VehicleUpdate

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

# Only Fleet Managers may create/update/delete vehicles; everyone can read.
manager_only = require_role(UserRole.FLEET_MANAGER.value)


def _find_by_registration(db: Session, reg: str, exclude_id: Optional[int] = None):
    q = db.query(Vehicle).filter(
        func.lower(Vehicle.registration_number) == reg.strip().lower()
    )
    if exclude_id is not None:
        q = q.filter(Vehicle.id != exclude_id)
    return q.first()


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    type: Optional[str] = None,
    status: Optional[str] = Query(default=None),
    region: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(Vehicle)
    if type:
        q = q.filter(Vehicle.type == type)
    if status:
        q = q.filter(Vehicle.status == status)
    if region:
        q = q.filter(Vehicle.region == region)
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(
            (Vehicle.registration_number.ilike(like))
            | (Vehicle.name_model.ilike(like))
        )
    return q.order_by(Vehicle.id).all()


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    return vehicle


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    body: VehicleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(manager_only),
):
    if _find_by_registration(db, body.registration_number):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Registration number '{body.registration_number}' already exists",
        )
    data = body.model_dump(exclude_none=True)
    data["registration_number"] = data["registration_number"].strip().upper()
    if not data.get("status"):
        data["status"] = VehicleStatus.AVAILABLE.value
    vehicle = Vehicle(**data)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    body: VehicleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(manager_only),
):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")

    data = body.model_dump(exclude_unset=True)
    if "registration_number" in data and data["registration_number"]:
        new_reg = data["registration_number"].strip()
        if _find_by_registration(db, new_reg, exclude_id=vehicle_id):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Registration number '{new_reg}' already exists",
            )
        data["registration_number"] = new_reg.upper()

    for field, value in data.items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(manager_only),
):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    db.delete(vehicle)
    db.commit()
