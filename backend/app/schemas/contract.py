from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class BillingCycleEnum(str, Enum):
    monthly = "monthly"
    yearly = "yearly"
    quarterly = "quarterly"
    onetime = "onetime"

class ContractStatusEnum(str, Enum):
    ativo = "ativo"
    encerrado = "encerrado"
    cancelado = "cancelado"

class ContractBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    value: Optional[float] = Field(0.0, ge=0)
    billing_cycle: Optional[BillingCycleEnum] = BillingCycleEnum.onetime
    start_date: date
    end_date: date
    auto_renew: bool = False
    cancel_days_before: int = Field(30, ge=0)
    contract_type: str = Field(..., min_length=1, max_length=100)

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    value: Optional[float] = Field(None, ge=0)
    billing_cycle: Optional[BillingCycleEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_renew: Optional[bool] = None
    cancel_days_before: Optional[int] = Field(None, ge=0)
    contract_type: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[ContractStatusEnum] = None

class ContractResponse(ContractBase):
    id: int
    status: ContractStatusEnum
    company_id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    file_path: Optional[str]
    days_until_expiry: Optional[int]
    alert: Optional[str]

    class Config:
        from_attributes = True

class ContractListResponse(BaseModel):
    contracts: List[ContractResponse]
    total: int

class DashboardStatsResponse(BaseModel):
    total_contracts: int
    active_contracts: int
    expired: int
    expiring_soon: int
    total_value: float
    potential_savings: float

    class Config:
        from_attributes = True
