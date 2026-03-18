from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AlertTypeEnum(str, Enum):
    renewal_upcoming = "renewal_upcoming"
    expiration = "expiration"
    cancellation_deadline = "cancellation_deadline"

class AlertSeverityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class AlertBase(BaseModel):
    contract_id: int
    alert_type: AlertTypeEnum
    severity: AlertSeverityEnum
    message: str = Field(..., min_length=1, max_length=500)
    due_date: Optional[datetime] = None
    is_read: bool = False

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    unread_count: int
