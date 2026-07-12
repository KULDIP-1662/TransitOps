from datetime import date as _date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseBase(BaseModel):
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    category: str = Field(default="Other")
    amount: float = Field(default=0, ge=0)
    description: Optional[str] = None
    date: Optional[_date] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    created_at: Optional[datetime] = None
    vehicle_registration: Optional[str] = None
    vehicle_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
