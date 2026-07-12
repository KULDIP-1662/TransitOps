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

        # Fleet mirrors the mockup: Gujarat plates, INR acquisition costs, kg capacity.
        vehicles = [
            Vehicle(
                registration_number="GJ01AB4521",
                name_model="VAN-05",
                type="Van",
                max_load_capacity=500,
                odometer=74000,
                acquisition_cost=620000,
                region="Gandhinagar",
                status=VehicleStatus.AVAILABLE.value,
            ),
            Vehicle(
                registration_number="GJ01AB9981",
                name_model="TRUCK-11",
                type="Truck",
                max_load_capacity=5000,
                odometer=182000,
                acquisition_cost=2450000,
                region="Ahmedabad",
                status=VehicleStatus.ON_TRIP.value,
            ),
            Vehicle(
                registration_number="GJ01AB1120",
                name_model="MINI-03",
                type="Mini",
                max_load_capacity=1000,
                odometer=66000,
                acquisition_cost=410000,
                region="Vatva",
                status=VehicleStatus.IN_SHOP.value,
            ),
            Vehicle(
                registration_number="GJ01AB0087",
                name_model="VAN-09",
                type="Van",
                max_load_capacity=750,
                odometer=241900,
                acquisition_cost=590000,
                region="Sanand",
                status=VehicleStatus.RETIRED.value,
            ),
            Vehicle(
                registration_number="GJ01AB3344",
                name_model="TRUCK-04",
                type="Truck",
                max_load_capacity=8000,
                odometer=95000,
                acquisition_cost=2180000,
                region="Mansa",
                status=VehicleStatus.AVAILABLE.value,
            ),
            Vehicle(
                registration_number="GJ01AB5566",
                name_model="MINI-08",
                type="Mini",
                max_load_capacity=1200,
                odometer=48000,
                acquisition_cost=460000,
                region="Kalol",
                status=VehicleStatus.AVAILABLE.value,
            ),
        ]
        db.add_all(vehicles)

        today = date.today()
        # Drivers mirror the mockup: Alex valid, John expired+suspended, etc.
        drivers = [
            Driver(
                name="Alex",
                license_number="DL-88213",
                license_category="LMV",
                license_expiry_date=date(2028, 12, 15),
                contact_number="98765 43210",
                safety_score=96,
                status=DriverStatus.AVAILABLE.value,
            ),
            Driver(
                name="John",
                license_number="DL-44120",
                license_category="HMV",
                license_expiry_date=date(2025, 3, 20),  # expired
                contact_number="98220 11987",
                safety_score=81,
                status=DriverStatus.SUSPENDED.value,
            ),
            Driver(
                name="Priya",
                license_number="DL-77031",
                license_category="LMV",
                license_expiry_date=date(2027, 8, 10),
                contact_number="99110 55420",
                safety_score=99,
                status=DriverStatus.ON_TRIP.value,
            ),
            Driver(
                name="Suresh",
                license_number="DL-90045",
                license_category="HMV",
                license_expiry_date=date(2027, 1, 5),
                contact_number="97440 88213",
                safety_score=88,
                status=DriverStatus.OFF_DUTY.value,
            ),
            Driver(
                name="Meena",
                license_number="DL-55210",
                license_category="LMV",
                license_expiry_date=today + timedelta(days=18),  # expiring soon
                contact_number="98330 22110",
                safety_score=90,
                status=DriverStatus.AVAILABLE.value,
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
