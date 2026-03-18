from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from ..database import get_db
from ..models import User
from ..schemas.alert import AlertResponse, AlertListResponse
from ..services.alerts import AlertService
from ..routers.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/", response_model=AlertListResponse)
def get_alerts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    unread_only: bool = False,
    limit: int = 50
):
    """Get alerts for current user's company"""
    return AlertService.get_user_alerts(db, current_user, unread_only, limit)

@router.post("/generate")
def generate_alerts(db: Session = Depends(get_db)):
    """Generate daily alerts (background job endpoint)"""
    new_alerts_count = AlertService.generate_daily_alerts(db)
    return {"message": f"Generated {new_alerts_count} new alerts"}

@router.put("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_as_read(
    alert_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Mark an alert as read"""
    return AlertService.mark_alert_as_read(alert_id, current_user, db)

@router.put("/read-all")
def mark_all_alerts_as_read(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Mark all alerts as read for user's company"""
    count = AlertService.mark_all_alerts_as_read(current_user, db)
    return {"message": f"Marked {count} alerts as read"}

@router.delete("/cleanup")
def cleanup_old_alerts(days_old: int = 90, db: Session = Depends(get_db)):
    """Clean up old read alerts (maintenance endpoint)"""
    count = AlertService.delete_old_alerts(db, days_old)
    return {"message": f"Deleted {count} old alerts"}
