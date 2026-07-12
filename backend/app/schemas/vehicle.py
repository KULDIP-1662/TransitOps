from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VehicleBase(BaseModel):
    registration_number: str = Field(min_length=1)
    name_model: str = Field(min_length=1)
    type: str = Field(min_length=1)
    max_load_capacity: float = Field(gt=0)
    odometer: float = Field(default=0, ge=0)
    acquisition_cost: float = Field(default=0, ge=0)
    region: Optional[str] = None


class VehicleCreate(VehicleBase):
    status: Optional[str] = None


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = Field(default=None, min_length=1)
    name_model: Optional[str] = Field(default=None, min_length=1)
    type: Optional[str] = Field(default=None, min_length=1)
    max_load_capacity: Optional[float] = Field(default=None, gt=0)
    odometer: Optional[float] = Field(default=None, ge=0)
    acquisition_cost: Optional[float] = Field(default=None, ge=0)
    region: Optional[str] = None
    status: Optional[str] = None


class VehicleOut(VehicleBase):
    id: int
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
