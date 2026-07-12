from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import VehicleStatus


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    name_model = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_capacity = Column(Float, nullable=False)
    odometer = Column(Float, default=0, nullable=False)
    acquisition_cost = Column(Float, default=0, nullable=False)
    region = Column(String, nullable=True)
    status = Column(String, default=VehicleStatus.AVAILABLE.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
