from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DriverBase(BaseModel):
    name: str = Field(min_length=1)
    license_number: str = Field(min_length=1)
    license_category: Optional[str] = None
    license_expiry_date: date
    contact_number: Optional[str] = None
    safety_score: float = Field(default=100, ge=0, le=100)


class DriverCreate(DriverBase):
    status: Optional[str] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    license_number: Optional[str] = Field(default=None, min_length=1)
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: Optional[str] = None


class DriverOut(DriverBase):
    id: int
    status: str
    created_at: Optional[datetime] = None
    # computed
    license_expired: bool
    expiring_soon: bool
    days_to_expiry: int
    trip_completions: int

    model_config = ConfigDict(from_attributes=True)
