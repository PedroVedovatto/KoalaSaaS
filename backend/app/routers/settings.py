from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List

from ..database import get_db
from ..models import User
from ..schemas.settings import (
    ContractTypeCreate, ContractTypeUpdate, ContractTypeResponse,
    ContractStatusCreate, ContractStatusUpdate, ContractStatusResponse
)
from ..services.settings import SettingsService
from ..routers.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

# Contract Types
@router.get("/contract-types", response_model=List[ContractTypeResponse])
def get_contract_types(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get all contract types for current user's company"""
    return SettingsService.get_contract_types(db, current_user)

@router.get("/contract-types/{contract_type_id}", response_model=ContractTypeResponse)
def get_contract_type(
    contract_type_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get a specific contract type by ID"""
    return SettingsService.get_contract_type(db, contract_type_id, current_user)

@router.post("/contract-types", response_model=ContractTypeResponse)
def create_contract_type(
    contract_type_data: ContractTypeCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Create a new contract type"""
    return SettingsService.create_contract_type(contract_type_data, current_user, db)

@router.put("/contract-types/{contract_type_id}", response_model=ContractTypeResponse)
def update_contract_type(
    contract_type_id: int,
    contract_type_data: ContractTypeUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Update an existing contract type"""
    return SettingsService.update_contract_type(contract_type_id, contract_type_data, current_user, db)

@router.delete("/contract-types/{contract_type_id}")
def delete_contract_type(
    contract_type_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete a contract type"""
    SettingsService.delete_contract_type(contract_type_id, current_user, db)
    return {"message": "Contract type deleted successfully"}

# Contract Statuses
@router.get("/contract-statuses", response_model=List[ContractStatusResponse])
def get_contract_statuses(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get all contract statuses for current user's company"""
    return SettingsService.get_contract_statuses(db, current_user)

@router.get("/contract-statuses/{contract_status_id}", response_model=ContractStatusResponse)
def get_contract_status(
    contract_status_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get a specific contract status by ID"""
    return SettingsService.get_contract_status(db, contract_status_id, current_user)

@router.post("/contract-statuses", response_model=ContractStatusResponse)
def create_contract_status(
    contract_status_data: ContractStatusCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Create a new contract status"""
    return SettingsService.create_contract_status(contract_status_data, current_user, db)

@router.put("/contract-statuses/{contract_status_id}", response_model=ContractStatusResponse)
def update_contract_status(
    contract_status_id: int,
    contract_status_data: ContractStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Update an existing contract status"""
    return SettingsService.update_contract_status(contract_status_id, contract_status_data, current_user, db)

@router.delete("/contract-statuses/{contract_status_id}")
def delete_contract_status(
    contract_status_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete a contract status"""
    SettingsService.delete_contract_status(contract_status_id, current_user, db)
    return {"message": "Contract status deleted successfully"}
