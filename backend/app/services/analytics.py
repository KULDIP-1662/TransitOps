"""Dashboard KPI and reports/analytics computations."""
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.enums import (
    DriverStatus,
    TripStatus,
    VehicleStatus,
)
from app.models.expense import Expense
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.trip import Trip
from app.models.vehicle import Vehicle


def _group_count(db: Session, column) -> dict:
    return dict(db.query(column, func.count()).group_by(column).all())


def _sum_by_vehicle(db: Session, model, amount_col) -> dict[int, float]:
    rows = (
        db.query(model.vehicle_id, func.coalesce(func.sum(amount_col), 0))
        .group_by(model.vehicle_id)
        .all()
    )
    return {vid: float(total) for vid, total in rows if vid is not None}


def compute_dashboard(db: Session) -> dict:
    vc = _group_count(db, Vehicle.status)
    available = vc.get(VehicleStatus.AVAILABLE.value, 0)
    on_trip = vc.get(VehicleStatus.ON_TRIP.value, 0)
    in_shop = vc.get(VehicleStatus.IN_SHOP.value, 0)
    retired = vc.get(VehicleStatus.RETIRED.value, 0)
    active_vehicles = available + on_trip + in_shop  # non-retired

    tc = _group_count(db, Trip.status)
    active_trips = tc.get(TripStatus.DISPATCHED.value, 0)
    pending_trips = tc.get(TripStatus.DRAFT.value, 0)
    completed_trips = tc.get(TripStatus.COMPLETED.value, 0)

    dcount = _group_count(db, Driver.status)
    drivers_on_duty = dcount.get(DriverStatus.AVAILABLE.value, 0) + dcount.get(
        DriverStatus.ON_TRIP.value, 0
    )
    total_drivers = sum(dcount.values())

    fleet_utilization = round(on_trip / active_vehicles * 100) if active_vehicles else 0

    recent = db.query(Trip).order_by(Trip.id.desc()).limit(6).all()
    recent_trips = [
        {
            "id": t.id,
            "vehicle_name": t.vehicle.name_model if t.vehicle else None,
            "driver_name": t.driver.name if t.driver else None,
            "status": t.status,
            "source": t.source,
            "destination": t.destination,
        }
        for t in recent
    ]

    vehicle_status = [
        {"label": VehicleStatus.AVAILABLE.value, "count": available},
        {"label": VehicleStatus.ON_TRIP.value, "count": on_trip},
        {"label": VehicleStatus.IN_SHOP.value, "count": in_shop},
        {"label": VehicleStatus.RETIRED.value, "count": retired},
    ]

    # Compliance: drivers with an expired or soon-to-expire (<=30d) licence.
    today = date.today()
    alert_drivers = (
        db.query(Driver)
        .filter(Driver.license_expiry_date <= today + timedelta(days=30))
        .order_by(Driver.license_expiry_date)
        .all()
    )
    license_alerts = [
        {
            "driver_id": d.id,
            "name": d.name,
            "license_number": d.license_number,
            "days_to_expiry": (d.license_expiry_date - today).days,
            "expired": d.license_expiry_date < today,
        }
        for d in alert_drivers
    ]

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available,
        "in_maintenance": in_shop,
        "on_trip_vehicles": on_trip,
        "retired_vehicles": retired,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "completed_trips": completed_trips,
        "total_trips": sum(tc.values()),
        "drivers_on_duty": drivers_on_duty,
        "total_drivers": total_drivers,
        "fleet_utilization": fleet_utilization,
        "vehicle_status": vehicle_status,
        "recent_trips": recent_trips,
        "license_alerts": license_alerts,
    }


def compute_reports(db: Session) -> dict:
    fuel_liters = _sum_by_vehicle(db, FuelLog, FuelLog.liters)
    fuel_cost = _sum_by_vehicle(db, FuelLog, FuelLog.cost)
    maint_cost = _sum_by_vehicle(db, MaintenanceLog, MaintenanceLog.cost)

    # Distance and revenue come from completed trips.
    dist_rows = (
        db.query(Trip.vehicle_id, func.coalesce(func.sum(Trip.planned_distance), 0))
        .filter(Trip.status == TripStatus.COMPLETED.value)
        .group_by(Trip.vehicle_id)
        .all()
    )
    distance = {vid: float(d) for vid, d in dist_rows}
    rev_rows = (
        db.query(Trip.vehicle_id, func.coalesce(func.sum(Trip.revenue), 0))
        .filter(Trip.status == TripStatus.COMPLETED.value)
        .group_by(Trip.vehicle_id)
        .all()
    )
    revenue = {vid: float(r) for vid, r in rev_rows}

    per_vehicle = []
    for v in db.query(Vehicle).order_by(Vehicle.name_model).all():
        d = distance.get(v.id, 0.0)
        fl = fuel_liters.get(v.id, 0.0)
        fc = fuel_cost.get(v.id, 0.0)
        mc = maint_cost.get(v.id, 0.0)
        rev = revenue.get(v.id, 0.0)
        op = fc + mc
        efficiency = round(d / fl, 2) if fl > 0 else 0.0
        roi = round((rev - op) / v.acquisition_cost * 100, 1) if v.acquisition_cost else 0.0
        per_vehicle.append(
            {
                "vehicle_id": v.id,
                "name_model": v.name_model,
                "registration_number": v.registration_number,
                "distance": d,
                "fuel_liters": fl,
                "fuel_efficiency": efficiency,
                "fuel_cost": fc,
                "maintenance_cost": mc,
                "operational_cost": op,
                "revenue": rev,
                "roi": roi,
            }
        )

    total_distance = sum(distance.values())
    total_fuel = sum(fuel_liters.values())
    total_op = sum(fuel_cost.values()) + sum(maint_cost.values())
    dash = compute_dashboard(db)

    return {
        "fuel_efficiency": round(total_distance / total_fuel, 2) if total_fuel else 0.0,
        "fleet_utilization": dash["fleet_utilization"],
        "total_operational_cost": total_op,
        "monthly_revenue": sum(revenue.values()),
        "total_distance": total_distance,
        "total_fuel_liters": total_fuel,
        "per_vehicle": per_vehicle,
    }
