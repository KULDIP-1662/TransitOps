"""Maintenance status automation.

Opening an active maintenance record puts the vehicle In Shop (removing it from
the dispatch pool); closing the last open record restores it to Available,
unless the vehicle is Retired.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import MaintenanceStatus, VehicleStatus
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle


def ensure_can_open(vehicle: Vehicle):
    if vehicle.status == VehicleStatus.ON_TRIP.value:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Vehicle is currently on a trip — complete or cancel it before maintenance",
        )


def sync_vehicle_status(db: Session, vehicle: Vehicle):
    """Recompute a vehicle's status from its open maintenance records."""
    if vehicle.status == VehicleStatus.RETIRED.value:
        return
    open_count = (
        db.query(MaintenanceLog)
        .filter(
            MaintenanceLog.vehicle_id == vehicle.id,
            MaintenanceLog.status == MaintenanceStatus.OPEN.value,
        )
        .count()
    )
    if open_count > 0:
        vehicle.status = VehicleStatus.IN_SHOP.value
    elif vehicle.status == VehicleStatus.IN_SHOP.value:
        vehicle.status = VehicleStatus.AVAILABLE.value
