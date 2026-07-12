from datetime import date as _date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class FuelBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float = Field(gt=0)
    cost: float = Field(default=0, ge=0)
    odometer: Optional[float] = Field(default=None, ge=0)
    date: Optional[_date] = None


class FuelCreate(FuelBase):
    pass


class FuelOut(FuelBase):
    id: int
    created_at: Optional[datetime] = None
    vehicle_registration: Optional[str] = None
    vehicle_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
