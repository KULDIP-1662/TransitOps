from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.expense import Expense
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.cost import CostSummary, VehicleCost

router = APIRouter(prefix="/api/costs", tags=["costs"])


def _sum_by_vehicle(db: Session, model, amount_col) -> dict[int, float]:
    rows = (
        db.query(model.vehicle_id, func.coalesce(func.sum(amount_col), 0))
        .group_by(model.vehicle_id)
        .all()
    )
    return {vid: float(total) for vid, total in rows if vid is not None}


@router.get("/summary", response_model=CostSummary)
def cost_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Per-vehicle operational cost (fuel + maintenance) and totals."""
    fuel = _sum_by_vehicle(db, FuelLog, FuelLog.cost)
    maint = _sum_by_vehicle(db, MaintenanceLog, MaintenanceLog.cost)
    other = _sum_by_vehicle(db, Expense, Expense.amount)

    per_vehicle: list[VehicleCost] = []
    for v in db.query(Vehicle).order_by(Vehicle.name_model).all():
        f = fuel.get(v.id, 0.0)
        m = maint.get(v.id, 0.0)
        o = other.get(v.id, 0.0)
        per_vehicle.append(
            VehicleCost(
                vehicle_id=v.id,
                name_model=v.name_model,
                registration_number=v.registration_number,
                fuel_cost=f,
                maintenance_cost=m,
                other_expenses=o,
                operational_cost=f + m,
            )
        )

    total_fuel = sum(fuel.values())
    total_maint = sum(maint.values())
    total_other = sum(other.values())
    return CostSummary(
        total_fuel_cost=total_fuel,
        total_maintenance_cost=total_maint,
        total_other_expenses=total_other,
        total_operational_cost=total_fuel + total_maint,
        per_vehicle=per_vehicle,
    )
