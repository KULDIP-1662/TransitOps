from pydantic import BaseModel


class VehicleCost(BaseModel):
    vehicle_id: int
    name_model: str
    registration_number: str
    fuel_cost: float
    maintenance_cost: float
    other_expenses: float
    operational_cost: float  # fuel + maintenance


class CostSummary(BaseModel):
    total_fuel_cost: float
    total_maintenance_cost: float
    total_other_expenses: float
    total_operational_cost: float
    per_vehicle: list[VehicleCost]
