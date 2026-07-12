import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.report import ReportOut
from app.services import analytics

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Reports are for Fleet Managers and Financial Analysts.
report_viewer = require_role(
    UserRole.FLEET_MANAGER.value, UserRole.FINANCIAL_ANALYST.value
)


@router.get("", response_model=ReportOut)
def reports(
    db: Session = Depends(get_db),
    _: User = Depends(report_viewer),
):
    return analytics.compute_reports(db)


@router.get("/export.csv")
def export_csv(
    db: Session = Depends(get_db),
    _: User = Depends(report_viewer),
):
    data = analytics.compute_reports(db)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Registration",
            "Vehicle",
            "Distance (km)",
            "Fuel (L)",
            "Fuel Efficiency (km/L)",
            "Fuel Cost",
            "Maintenance Cost",
            "Operational Cost",
            "Revenue",
            "ROI (%)",
        ]
    )
    for v in data["per_vehicle"]:
        writer.writerow(
            [
                v["registration_number"],
                v["name_model"],
                v["distance"],
                v["fuel_liters"],
                v["fuel_efficiency"],
                v["fuel_cost"],
                v["maintenance_cost"],
                v["operational_cost"],
                v["revenue"],
                v["roi"],
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=transitops_report.csv"
        },
    )
