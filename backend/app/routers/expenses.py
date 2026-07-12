from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.enums import UserRole
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

finance_admin = require_role(
    UserRole.FINANCIAL_ANALYST.value, UserRole.FLEET_MANAGER.value
)


def _serialize(rec: Expense) -> ExpenseOut:
    return ExpenseOut(
        id=rec.id,
        vehicle_id=rec.vehicle_id,
        trip_id=rec.trip_id,
        category=rec.category,
        amount=rec.amount,
        description=rec.description,
        date=rec.date,
        created_at=rec.created_at,
        vehicle_registration=rec.vehicle.registration_number if rec.vehicle else None,
        vehicle_name=rec.vehicle.name_model if rec.vehicle else None,
    )


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    vehicle_id: Optional[int] = None,
):
    q = db.query(Expense)
    if vehicle_id:
        q = q.filter(Expense.vehicle_id == vehicle_id)
    return [_serialize(r) for r in q.order_by(Expense.id.desc()).all()]


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(finance_admin),
):
    rec = Expense(**body.model_dump())
    if rec.date is None:
        rec.date = date.today()
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _serialize(rec)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(finance_admin),
):
    rec = db.get(Expense, record_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
    db.delete(rec)
    db.commit()
