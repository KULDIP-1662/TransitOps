"""Seed the database with demo users and a sample fleet.

Includes the exact entities from the TransitOps spec Example Workflow
(vehicle "Van-05" with 500 kg capacity and driver "Alex") so the demo
video can be reproduced end to end.

Run from the backend/ directory:  python -m app.seed
"""
from datetime import date, timedelta

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import Driver, User, Vehicle
from app.models.enums import DriverStatus, UserRole, VehicleStatus

DEMO_PASSWORD = "password123"


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded; skipping.")
            return

        users = [
            User(
                name="Fatima Manager",
                email="fleet@transitops.com",
                password_hash=hash_password(DEMO_PASSWORD),
                role=UserRole.FLEET_MANAGER.value,
            ),
            User(
                name="Danny Driver",
                email="driver@transitops.com",
                password_hash=hash_password(DEMO_PASSWORD),
                role=UserRole.DRIVER.value,
            ),
            User(
                name="Sam Safety",
                email="safety@transitops.com",
                password_hash=hash_password(DEMO_PASSWORD),
                role=UserRole.SAFETY_OFFICER.value,
            ),
            User(
                name="Fiona Finance",
                email="finance@transitops.com",
                password_hash=hash_password(DEMO_PASSWORD),
                role=UserRole.FINANCIAL_ANALYST.value,
            ),
        ]
        db.add_all(users)

        vehicles = [
            Vehicle(
                registration_number="VAN-05",
                name_model="Ford Transit Van",
                type="Van",
                max_load_capacity=500,
                odometer=42000,
                acquisition_cost=28000,
                region="North",
                status=VehicleStatus.AVAILABLE.value,
            ),
            Vehicle(
                registration_number="TRK-11",
                name_model="Tata LPT 1613",
                type="Truck",
                max_load_capacity=9000,
                odometer=118000,
                acquisition_cost=52000,
                region="West",
                status=VehicleStatus.AVAILABLE.value,
            ),
            Vehicle(
                registration_number="TRK-22",
                name_model="Volvo FH16",
                type="Truck",
                max_load_capacity=15000,
                odometer=76000,
                acquisition_cost=95000,
                region="South",
                status=VehicleStatus.AVAILABLE.value,
            ),
            Vehicle(
                registration_number="PKP-07",
                name_model="Toyota Hilux",
                type="Pickup",
                max_load_capacity=1000,
                odometer=63000,
                acquisition_cost=31000,
                region="East",
                status=VehicleStatus.RETIRED.value,
            ),
        ]
        db.add_all(vehicles)

        today = date.today()
        drivers = [
            Driver(
                name="Alex",
                license_number="DL-ALEX-001",
                license_category="LMV",
                license_expiry_date=today + timedelta(days=400),
                contact_number="+1-555-0100",
                safety_score=95,
                status=DriverStatus.AVAILABLE.value,
            ),
            Driver(
                name="Bianca",
                license_number="DL-BIA-002",
                license_category="HMV",
                license_expiry_date=today + timedelta(days=25),  # expiring soon
                contact_number="+1-555-0101",
                safety_score=88,
                status=DriverStatus.AVAILABLE.value,
            ),
            Driver(
                name="Carlos",
                license_number="DL-CAR-003",
                license_category="HMV",
                license_expiry_date=today - timedelta(days=10),  # expired
                contact_number="+1-555-0102",
                safety_score=72,
                status=DriverStatus.AVAILABLE.value,
            ),
            Driver(
                name="Divya",
                license_number="DL-DIV-004",
                license_category="LMV",
                license_expiry_date=today + timedelta(days=200),
                contact_number="+1-555-0103",
                safety_score=60,
                status=DriverStatus.SUSPENDED.value,
            ),
        ]
        db.add_all(drivers)

        db.commit()
        print("Seed complete.")
        print(f"  Users: {len(users)} (password for all: {DEMO_PASSWORD})")
        print(f"  Vehicles: {len(vehicles)}")
        print(f"  Drivers: {len(drivers)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
