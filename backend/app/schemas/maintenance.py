from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MaintenanceBase(BaseModel):
    vehicle_id: int
    description: str = Field(min_length=1)
    cost: float = Field(default=0, ge=0)
    start_date: Optional[date] = None


class MaintenanceCreate(MaintenanceBase):
    status: Optional[str] = None


class MaintenanceUpdate(BaseModel):
    description: Optional[str] = Field(default=None, min_length=1)
    cost: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class MaintenanceOut(BaseModel):
    id: int
    vehicle_id: int
    description: str
    cost: float
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: Optional[datetime] = None
    vehicle_registration: Optional[str] = None
    vehicle_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
