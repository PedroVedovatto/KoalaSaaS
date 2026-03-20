from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional

from ..database import get_db
from ..models import User
from ..schemas.contract import (
    ContractCreate, ContractUpdate, ContractResponse, 
    ContractListResponse, DashboardStatsResponse
)
from ..services.contracts import ContractService
from ..routers.auth import get_current_user

router = APIRouter(prefix="/contracts", tags=["contracts"])

@router.get("/", response_model=List[ContractResponse])
def get_contracts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    contract_type: Optional[str] = None
):
    """Get contracts for current user's company with filters"""
    return ContractService.get_contracts(
        db, current_user, skip, limit, search, status, contract_type
    )

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get a specific contract by ID"""
    return ContractService.get_contract(db, contract_id, current_user)

@router.post("/", response_model=ContractResponse)
async def create_contract(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    name: str = Form(...),
    contract_type: str = Form(...),
    description: str = Form(""),
    value: float = Form(0.0),
    billing_cycle: str = Form("onetime"),
    start_date: str = Form(...),
    end_date: str = Form(...),
    auto_renew: bool = Form(False),
    cancel_days_before: int = Form(30),
    file: Optional[UploadFile] = File(None)
):
    """Create a new contract with optional file upload"""
    from datetime import datetime
    
    # Parse dates from string
    start_date_parsed = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date_parsed = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    contract_data = ContractCreate(
        name=name,
        contract_type=contract_type,
        description=description,
        value=value,
        billing_cycle=billing_cycle,
        start_date=start_date_parsed,
        end_date=end_date_parsed,
        auto_renew=auto_renew,
        cancel_days_before=cancel_days_before
    )
    
    return ContractService.create_contract(contract_data, file, current_user, db)

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    contract_data: ContractUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Update an existing contract"""
    return ContractService.update_contract(contract_id, contract_data, current_user, db)

@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete a contract"""
    ContractService.delete_contract(contract_id, current_user, db)
    return {"message": "Contract deleted successfully"}

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for current user's company"""
    return ContractService.get_dashboard_stats(current_user, db)
