"""Business-rule engine for trip dispatch and lifecycle transitions.

Enforces the mandatory rules from the spec (§4) and performs the automatic
vehicle/driver status transitions on dispatch / complete / cancel.
"""
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle


def _reject(message: str):
    raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, message)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def validate_assignment(vehicle: Vehicle, driver: Driver, cargo_weight: float):
    """Validate a vehicle+driver+cargo assignment against the business rules."""
    # --- Vehicle eligibility ---
    if vehicle.status == VehicleStatus.RETIRED.value:
        _reject("Vehicle is retired and cannot be dispatched")
    if vehicle.status == VehicleStatus.IN_SHOP.value:
        _reject("Vehicle is in the shop and cannot be dispatched")
    if vehicle.status == VehicleStatus.ON_TRIP.value:
        _reject("Vehicle is already on another trip")

    # --- Driver eligibility ---
    if driver.status == DriverStatus.SUSPENDED.value:
        _reject("Driver is suspended and cannot be assigned")
    if driver.status == DriverStatus.ON_TRIP.value:
        _reject("Driver is already on another trip")
    if driver.status == DriverStatus.OFF_DUTY.value:
        _reject("Driver is off duty and cannot be assigned")
    if driver.license_expiry_date < date.today():
        _reject("Driver's license has expired")

    # --- Capacity ---
    if cargo_weight > vehicle.max_load_capacity:
        over = cargo_weight - vehicle.max_load_capacity
        _reject(
            f"Capacity exceeded by {over:g} kg — cargo {cargo_weight:g} kg "
            f"exceeds vehicle capacity {vehicle.max_load_capacity:g} kg"
        )


def load_vehicle_driver(db: Session, trip: Trip) -> tuple[Vehicle, Driver]:
    vehicle = db.get(Vehicle, trip.vehicle_id)
    driver = db.get(Driver, trip.driver_id)
    if vehicle is None:
        _reject("Vehicle not found")
    if driver is None:
        _reject("Driver not found")
    return vehicle, driver


def dispatch_trip(db: Session, trip: Trip):
    if trip.status != TripStatus.DRAFT.value:
        _reject(f"Only draft trips can be dispatched (current: {trip.status})")
    vehicle, driver = load_vehicle_driver(db, trip)
    validate_assignment(vehicle, driver, trip.cargo_weight)
    vehicle.status = VehicleStatus.ON_TRIP.value
    driver.status = DriverStatus.ON_TRIP.value
    trip.status = TripStatus.DISPATCHED.value
    trip.dispatched_at = _now()


def complete_trip(
    db: Session,
    trip: Trip,
    final_odometer: float,
    fuel_consumed: float,
    revenue: float | None = None,
):
    if trip.status != TripStatus.DISPATCHED.value:
        _reject(f"Only dispatched trips can be completed (current: {trip.status})")
    vehicle, driver = load_vehicle_driver(db, trip)
    trip.final_odometer = final_odometer
    trip.fuel_consumed = fuel_consumed
    if revenue is not None:
        trip.revenue = revenue
    # Roll the vehicle odometer forward.
    if final_odometer and final_odometer > vehicle.odometer:
        vehicle.odometer = final_odometer
    vehicle.status = VehicleStatus.AVAILABLE.value
    driver.status = DriverStatus.AVAILABLE.value
    trip.status = TripStatus.COMPLETED.value
    trip.completed_at = _now()


def cancel_trip(db: Session, trip: Trip):
    if trip.status in (TripStatus.COMPLETED.value, TripStatus.CANCELLED.value):
        _reject(f"Trip is already {trip.status.lower()} and cannot be cancelled")
    # A dispatched trip has reserved the vehicle/driver — release them.
    if trip.status == TripStatus.DISPATCHED.value:
        vehicle, driver = load_vehicle_driver(db, trip)
        vehicle.status = VehicleStatus.AVAILABLE.value
        driver.status = DriverStatus.AVAILABLE.value
    trip.status = TripStatus.CANCELLED.value
