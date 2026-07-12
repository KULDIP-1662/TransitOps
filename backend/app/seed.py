"""Seed the database with demo users and a sample fleet.

Includes the exact entities from the TransitOps spec Example Workflow
(vehicle "Van-05" with 500 kg capacity and driver "Alex") so the demo
video can be reproduced end to end.

Run from the backend/ directory:  python -m app.seed
"""
from datetime import date, datetime, timedelta

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import (
    Driver,
    Expense,
    FuelLog,
    MaintenanceLog,
    Trip,
    User,
    Vehicle,
)
from app.models.enums import (
    DriverStatus,
    ExpenseCategory,
    MaintenanceStatus,
    TripStatus,
    UserRole,
    VehicleStatus,
)

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
        db.flush()  # assign ids so trips can reference vehicles/drivers

        vmap = {v.name_model: v for v in vehicles}
        dmap = {d.name: d for d in drivers}

        # Seed trips across lifecycle stages (kept consistent with the seeded
        # vehicle/driver statuses: TRUCK-11 & Priya are On Trip => a Dispatched
        # trip). Distances/revenue chosen to give realistic ~8 km/L efficiency.
        trips = [
            Trip(  # trips[0] — referenced by the VAN-05 fuel log below
                source="Gandhinagar Depot",
                destination="Ahmedabad Hub",
                vehicle=vmap["VAN-05"],
                driver=dmap["Alex"],
                cargo_weight=450,
                planned_distance=360,
                final_odometer=74360,
                fuel_consumed=40,
                revenue=45000,
                status=TripStatus.COMPLETED.value,
                completed_at=datetime(2026, 7, 5, 14, 30),
            ),
            Trip(
                source="Mansa",
                destination="Kalol Depot",
                vehicle=vmap["MINI-08"],
                driver=dmap["Meena"],
                cargo_weight=600,
                planned_distance=230,
                fuel_consumed=27,
                revenue=22000,
                status=TripStatus.COMPLETED.value,
                completed_at=datetime(2026, 7, 4, 12, 0),
            ),
            Trip(
                source="Vatva Industrial Area",
                destination="Sanand Warehouse",
                vehicle=vmap["TRUCK-11"],
                driver=dmap["Priya"],
                cargo_weight=4000,
                planned_distance=880,
                fuel_consumed=108,
                revenue=95000,
                status=TripStatus.COMPLETED.value,
                completed_at=datetime(2026, 7, 3, 18, 0),
            ),
            Trip(  # current dispatched trip -> TRUCK-11 & Priya are On Trip
                source="Ahmedabad Hub",
                destination="Rajkot Depot",
                vehicle=vmap["TRUCK-11"],
                driver=dmap["Priya"],
                cargo_weight=3800,
                planned_distance=210,
                revenue=40000,
                status=TripStatus.DISPATCHED.value,
                dispatched_at=datetime(2026, 7, 7, 9, 0),
            ),
            Trip(  # awaiting dispatch
                source="Gandhinagar Depot",
                destination="Nadiad Hub",
                vehicle=vmap["VAN-05"],
                driver=dmap["Alex"],
                cargo_weight=300,
                planned_distance=64,
                revenue=9000,
                status=TripStatus.DRAFT.value,
            ),
        ]
        db.add_all(trips)

        # Maintenance: MINI-03 is In Shop because of an open record; a closed
        # record on TRUCK-04 shows history without affecting its status.
        maintenance = [
            MaintenanceLog(
                vehicle=vmap["MINI-03"],
                description="Tyre Replacement",
                cost=6200,
                status=MaintenanceStatus.OPEN.value,
                start_date=date(2026, 7, 6),
            ),
            MaintenanceLog(
                vehicle=vmap["TRUCK-04"],
                description="Engine Service",
                cost=18000,
                status=MaintenanceStatus.CLOSED.value,
                start_date=date(2026, 6, 20),
                end_date=date(2026, 6, 25),
            ),
        ]
        db.add_all(maintenance)

        # Fuel logs and other expenses (mirrors the mockup figures).
        fuel_logs = [
            FuelLog(vehicle=vmap["VAN-05"], trip=trips[0], liters=42, cost=3150,
                    odometer=74260, date=date(2026, 7, 5)),
            FuelLog(vehicle=vmap["TRUCK-11"], liters=110, cost=8400,
                    odometer=182000, date=date(2026, 7, 6)),
            FuelLog(vehicle=vmap["MINI-08"], liters=28, cost=2050, date=date(2026, 7, 6)),
        ]
        db.add_all(fuel_logs)

        expenses = [
            Expense(vehicle=vmap["VAN-05"], category=ExpenseCategory.TOLL.value,
                    amount=120, description="Highway toll", date=date(2026, 7, 5)),
            Expense(vehicle=vmap["TRUCK-11"], category=ExpenseCategory.TOLL.value,
                    amount=340, description="Expressway toll", date=date(2026, 7, 6)),
            Expense(vehicle=vmap["MINI-08"], category=ExpenseCategory.PARKING.value,
                    amount=150, description="Depot parking", date=date(2026, 7, 6)),
        ]
        db.add_all(expenses)

        db.commit()
        print("Seed complete.")
        print(f"  Users: {len(users)} (password for all: {DEMO_PASSWORD})")
        print(f"  Vehicles: {len(vehicles)}")
        print(f"  Drivers: {len(drivers)}")
        print(f"  Trips: {len(trips)}")
        print(f"  Maintenance: {len(maintenance)}")
        print(f"  Fuel logs: {len(fuel_logs)}  Expenses: {len(expenses)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
