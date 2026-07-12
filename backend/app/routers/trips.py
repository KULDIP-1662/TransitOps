from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.driver import Driver
from app.models.enums import DriverStatus, UserRole, VehicleStatus
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.trip import (
    DispatchDriver,
    DispatchOptions,
    DispatchVehicle,
    TripComplete,
    TripCreate,
    TripOut,
)
from app.services import trip_rules

router = APIRouter(prefix="/api/trips", tags=["trips"])

# Trips are created and dispatched by the Driver role.
trip_admin = require_role(UserRole.DRIVER.value)


def _serialize(trip: Trip) -> TripOut:
    return TripOut(
        id=trip.id,
        source=trip.source,
        destination=trip.destination,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        cargo_weight=trip.cargo_weight,
        planned_distance=trip.planned_distance,
        final_odometer=trip.final_odometer,
        fuel_consumed=trip.fuel_consumed,
        revenue=trip.revenue,
        status=trip.status,
        created_at=trip.created_at,
        dispatched_at=trip.dispatched_at,
        completed_at=trip.completed_at,
        vehicle_registration=trip.vehicle.registration_number if trip.vehicle else None,
        vehicle_name=trip.vehicle.name_model if trip.vehicle else None,
        vehicle_capacity=trip.vehicle.max_load_capacity if trip.vehicle else None,
        driver_name=trip.driver.name if trip.driver else None,
    )


@router.get("", response_model=list[TripOut])
def list_trips(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: Optional[str] = None,
):
    q = db.query(Trip)
    if status:
        q = q.filter(Trip.status == status)
    trips = q.order_by(Trip.id.desc()).all()
    return [_serialize(t) for t in trips]


@router.get("/dispatch-options", response_model=DispatchOptions)
def dispatch_options(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Available vehicles and eligible drivers for the create-trip form."""
    vehicles = (
        db.query(Vehicle)
        .filter(Vehicle.status == VehicleStatus.AVAILABLE.value)
        .order_by(Vehicle.name_model)
        .all()
    )
    drivers = (
        db.query(Driver)
        .filter(
            Driver.status == DriverStatus.AVAILABLE.value,
            Driver.license_expiry_date >= date.today(),
        )
        .order_by(Driver.name)
        .all()
    )
    return DispatchOptions(
        vehicles=[DispatchVehicle.model_validate(v) for v in vehicles],
        drivers=[DispatchDriver.model_validate(d) for d in drivers],
    )


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    body: TripCreate,
    db: Session = Depends(get_db),
    _: User = Depends(trip_admin),
):
    vehicle = db.get(Vehicle, body.vehicle_id)
    driver = db.get(Driver, body.driver_id)
    if vehicle is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")
    # Validate the assignment up front (capacity, availability, license).
    trip_rules.validate_assignment(vehicle, driver, body.cargo_weight)

    trip = Trip(**body.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return _serialize(trip)


def _get_trip(db: Session, trip_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    return trip


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def dispatch(trip_id: int, db: Session = Depends(get_db), _: User = Depends(trip_admin)):
    trip = _get_trip(db, trip_id)
    trip_rules.dispatch_trip(db, trip)
    db.commit()
    db.refresh(trip)
    return _serialize(trip)


@router.post("/{trip_id}/complete", response_model=TripOut)
def complete(
    trip_id: int,
    body: TripComplete,
    db: Session = Depends(get_db),
    _: User = Depends(trip_admin),
):
    trip = _get_trip(db, trip_id)
    trip_rules.complete_trip(
        db, trip, body.final_odometer, body.fuel_consumed, body.revenue
    )
    db.commit()
    db.refresh(trip)
    return _serialize(trip)


@router.post("/{trip_id}/cancel", response_model=TripOut)
def cancel(trip_id: int, db: Session = Depends(get_db), _: User = Depends(trip_admin)):
    trip = _get_trip(db, trip_id)
    trip_rules.cancel_trip(db, trip)
    db.commit()
    db.refresh(trip)
    return _serialize(trip)
