from sqlalchemy import Column, Date, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import DriverStatus


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String, nullable=True)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String, nullable=True)
    safety_score = Column(Float, default=100, nullable=False)
    status = Column(String, default=DriverStatus.AVAILABLE.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
