from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, UserRole
from app.models.trip import Trip
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverOut, DriverUpdate

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

# Fleet Managers and Safety Officers manage drivers; everyone can read.
driver_admin = require_role(
    UserRole.FLEET_MANAGER.value, UserRole.SAFETY_OFFICER.value
)

EXPIRY_WARN_DAYS = 30


def _completion_counts(db: Session) -> dict[int, int]:
    rows = (
        db.query(Trip.driver_id, func.count(Trip.id))
        .filter(Trip.status == TripStatus.COMPLETED.value)
        .group_by(Trip.driver_id)
        .all()
    )
    return {driver_id: count for driver_id, count in rows}


def _serialize(driver: Driver, completions: dict[int, int]) -> DriverOut:
    days = (driver.license_expiry_date - date.today()).days
    return DriverOut(
        id=driver.id,
        name=driver.name,
        license_number=driver.license_number,
        license_category=driver.license_category,
        license_expiry_date=driver.license_expiry_date,
        contact_number=driver.contact_number,
        safety_score=driver.safety_score,
        status=driver.status,
        created_at=driver.created_at,
        license_expired=days < 0,
        expiring_soon=0 <= days <= EXPIRY_WARN_DAYS,
        days_to_expiry=days,
        trip_completions=completions.get(driver.id, 0),
    )


def _find_by_license(db: Session, lic: str, exclude_id: Optional[int] = None):
    q = db.query(Driver).filter(
        func.lower(Driver.license_number) == lic.strip().lower()
    )
    if exclude_id is not None:
        q = q.filter(Driver.id != exclude_id)
    return q.first()


@router.get("", response_model=list[DriverOut])
def list_drivers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(Driver)
    if status:
        q = q.filter(Driver.status == status)
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(
            (Driver.name.ilike(like)) | (Driver.license_number.ilike(like))
        )
    drivers = q.order_by(Driver.id).all()
    completions = _completion_counts(db)
    return [_serialize(d, completions) for d in drivers]


@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED)
def create_driver(
    body: DriverCreate,
    db: Session = Depends(get_db),
    _: User = Depends(driver_admin),
):
    if _find_by_license(db, body.license_number):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"License number '{body.license_number}' already exists",
        )
    data = body.model_dump(exclude_none=True)
    if not data.get("status"):
        data["status"] = DriverStatus.AVAILABLE.value
    driver = Driver(**data)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return _serialize(driver, _completion_counts(db))


@router.patch("/{driver_id}", response_model=DriverOut)
def update_driver(
    driver_id: int,
    body: DriverUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(driver_admin),
):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")

    data = body.model_dump(exclude_unset=True)
    if "license_number" in data and data["license_number"]:
        if _find_by_license(db, data["license_number"], exclude_id=driver_id):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"License number '{data['license_number']}' already exists",
            )
    for field, value in data.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return _serialize(driver, _completion_counts(db))


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(driver_admin),
):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")
    db.delete(driver)
    db.commit()
