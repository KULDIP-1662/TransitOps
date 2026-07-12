from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TripCreate(BaseModel):
    source: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(ge=0)
    planned_distance: float = Field(default=0, ge=0)
    revenue: float = Field(default=0, ge=0)


class TripComplete(BaseModel):
    final_odometer: float = Field(ge=0)
    fuel_consumed: float = Field(gt=0)
    revenue: Optional[float] = Field(default=None, ge=0)


class TripOut(BaseModel):
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    final_odometer: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: float
    status: str
    created_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    # denormalised for display
    vehicle_registration: Optional[str] = None
    vehicle_name: Optional[str] = None
    vehicle_capacity: Optional[float] = None
    driver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DispatchVehicle(BaseModel):
    id: int
    registration_number: str
    name_model: str
    max_load_capacity: float

    model_config = ConfigDict(from_attributes=True)


class DispatchDriver(BaseModel):
    id: int
    name: str
    license_number: str

    model_config = ConfigDict(from_attributes=True)


class DispatchOptions(BaseModel):
    vehicles: list[DispatchVehicle]
    drivers: list[DispatchDriver]
