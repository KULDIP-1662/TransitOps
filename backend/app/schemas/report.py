from pydantic import BaseModel


class VehicleReport(BaseModel):
    vehicle_id: int
    name_model: str
    registration_number: str
    distance: float
    fuel_liters: float
    fuel_efficiency: float
    fuel_cost: float
    maintenance_cost: float
    operational_cost: float
    revenue: float
    roi: float


class ReportOut(BaseModel):
    fuel_efficiency: float
    fleet_utilization: int
    total_operational_cost: float
    monthly_revenue: float
    total_distance: float
    total_fuel_liters: float
    per_vehicle: list[VehicleReport]
