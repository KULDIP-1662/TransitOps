from typing import Optional

from pydantic import BaseModel


class RecentTrip(BaseModel):
    id: int
    vehicle_name: Optional[str] = None
    driver_name: Optional[str] = None
    status: str
    source: str
    destination: str


class StatusCount(BaseModel):
    label: str
    count: int


class LicenseAlert(BaseModel):
    driver_id: int
    name: str
    license_number: str
    days_to_expiry: int
    expired: bool


class DashboardOut(BaseModel):
    active_vehicles: int
    available_vehicles: int
    in_maintenance: int
    on_trip_vehicles: int
    retired_vehicles: int
    active_trips: int
    pending_trips: int
    completed_trips: int
    total_trips: int
    drivers_on_duty: int
    total_drivers: int
    fleet_utilization: int
    vehicle_status: list[StatusCount]
    recent_trips: list[RecentTrip]
    license_alerts: list[LicenseAlert]
