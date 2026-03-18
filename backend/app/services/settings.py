from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime

from ..models import ContractType, ContractStatus, User
from ..schemas.settings import (
    ContractTypeCreate, ContractTypeUpdate, ContractTypeResponse,
    ContractStatusCreate, ContractStatusUpdate, ContractStatusResponse
)

class SettingsService:

    # Contract Types
    @staticmethod
    def get_contract_types(db: Session, current_user: User) -> List[ContractTypeResponse]:
        contract_types = db.query(ContractType).filter(
            ContractType.company_id == current_user.company_id
        ).all()
        
        result = []
        for contract_type in contract_types:
            contract_type_dict = {
                "id": contract_type.id,
                "name": contract_type.name,
                "description": contract_type.description,
                "color": contract_type.color,
                "company_id": contract_type.company_id,
                "created_at": contract_type.created_at.isoformat(),
                "updated_at": contract_type.updated_at.isoformat()
            }
            result.append(ContractTypeResponse(**contract_type_dict))
        
        return result

    @staticmethod
    def get_contract_type(db: Session, contract_type_id: int, current_user: User) -> ContractTypeResponse:
        contract_type = db.query(ContractType).filter(
            ContractType.id == contract_type_id,
            ContractType.company_id == current_user.company_id
        ).first()
        
        if not contract_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract type not found"
            )
        
        contract_type_dict = {
            "id": contract_type.id,
            "name": contract_type.name,
            "description": contract_type.description,
            "color": contract_type.color,
            "company_id": contract_type.company_id,
            "created_at": contract_type.created_at.isoformat(),
            "updated_at": contract_type.updated_at.isoformat()
        }
        
        return ContractTypeResponse(**contract_type_dict)

    @staticmethod
    def create_contract_type(contract_type_data: ContractTypeCreate, current_user: User, db: Session) -> ContractTypeResponse:
        # Check if name already exists for this company
        existing = db.query(ContractType).filter(
            ContractType.name == contract_type_data.name,
            ContractType.company_id == current_user.company_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract type with this name already exists"
            )
        
        contract_type = ContractType(
            name=contract_type_data.name,
            description=contract_type_data.description,
            color=contract_type_data.color,
            company_id=current_user.company_id
        )
        
        db.add(contract_type)
        db.commit()
        db.refresh(contract_type)
        
        contract_type_dict = {
            "id": contract_type.id,
            "name": contract_type.name,
            "description": contract_type.description,
            "color": contract_type.color,
            "company_id": contract_type.company_id,
            "created_at": contract_type.created_at.isoformat(),
            "updated_at": contract_type.updated_at.isoformat()
        }
        
        return ContractTypeResponse(**contract_type_dict)

    @staticmethod
    def update_contract_type(contract_type_id: int, contract_type_data: ContractTypeUpdate, current_user: User, db: Session) -> ContractTypeResponse:
        contract_type = db.query(ContractType).filter(
            ContractType.id == contract_type_id,
            ContractType.company_id == current_user.company_id
        ).first()
        
        if not contract_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract type not found"
            )
        
        # Check if name already exists (if updating name)
        if contract_type_data.name and contract_type_data.name != contract_type.name:
            existing = db.query(ContractType).filter(
                ContractType.name == contract_type_data.name,
                ContractType.company_id == current_user.company_id,
                ContractType.id != contract_type_id
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contract type with this name already exists"
                )
        
        # Update fields
        update_data = contract_type_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contract_type, field, value)
        
        contract_type.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(contract_type)
        
        contract_type_dict = {
            "id": contract_type.id,
            "name": contract_type.name,
            "description": contract_type.description,
            "color": contract_type.color,
            "company_id": contract_type.company_id,
            "created_at": contract_type.created_at.isoformat(),
            "updated_at": contract_type.updated_at.isoformat()
        }
        
        return ContractTypeResponse(**contract_type_dict)

    @staticmethod
    def delete_contract_type(contract_type_id: int, current_user: User, db: Session) -> bool:
        contract_type = db.query(ContractType).filter(
            ContractType.id == contract_type_id,
            ContractType.company_id == current_user.company_id
        ).first()
        
        if not contract_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract type not found"
            )
        
        db.delete(contract_type)
        db.commit()
        return True

    # Contract Statuses
    @staticmethod
    def get_contract_statuses(db: Session, current_user: User) -> List[ContractStatusResponse]:
        contract_statuses = db.query(ContractStatus).filter(
            ContractStatus.company_id == current_user.company_id
        ).all()
        
        result = []
        for contract_status in contract_statuses:
            contract_status_dict = {
                "id": contract_status.id,
                "name": contract_status.name,
                "description": contract_status.description,
                "color": contract_status.color,
                "company_id": contract_status.company_id,
                "created_at": contract_status.created_at.isoformat(),
                "updated_at": contract_status.updated_at.isoformat()
            }
            result.append(ContractStatusResponse(**contract_status_dict))
        
        return result

    @staticmethod
    def get_contract_status(db: Session, contract_status_id: int, current_user: User) -> ContractStatusResponse:
        contract_status = db.query(ContractStatus).filter(
            ContractStatus.id == contract_status_id,
            ContractStatus.company_id == current_user.company_id
        ).first()
        
        if not contract_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract status not found"
            )
        
        contract_status_dict = {
            "id": contract_status.id,
            "name": contract_status.name,
            "description": contract_status.description,
            "color": contract_status.color,
            "company_id": contract_status.company_id,
            "created_at": contract_status.created_at.isoformat(),
            "updated_at": contract_status.updated_at.isoformat()
        }
        
        return ContractStatusResponse(**contract_status_dict)

    @staticmethod
    def create_contract_status(contract_status_data: ContractStatusCreate, current_user: User, db: Session) -> ContractStatusResponse:
        # Check if name already exists for this company
        existing = db.query(ContractStatus).filter(
            ContractStatus.name == contract_status_data.name,
            ContractStatus.company_id == current_user.company_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract status with this name already exists"
            )
        
        contract_status = ContractStatus(
            name=contract_status_data.name,
            description=contract_status_data.description,
            color=contract_status_data.color,
            company_id=current_user.company_id
        )
        
        db.add(contract_status)
        db.commit()
        db.refresh(contract_status)
        
        contract_status_dict = {
            "id": contract_status.id,
            "name": contract_status.name,
            "description": contract_status.description,
            "color": contract_status.color,
            "company_id": contract_status.company_id,
            "created_at": contract_status.created_at.isoformat(),
            "updated_at": contract_status.updated_at.isoformat()
        }
        
        return ContractStatusResponse(**contract_status_dict)

    @staticmethod
    def update_contract_status(contract_status_id: int, contract_status_data: ContractStatusUpdate, current_user: User, db: Session) -> ContractStatusResponse:
        contract_status = db.query(ContractStatus).filter(
            ContractStatus.id == contract_status_id,
            ContractStatus.company_id == current_user.company_id
        ).first()
        
        if not contract_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract status not found"
            )
        
        # Check if name already exists (if updating name)
        if contract_status_data.name and contract_status_data.name != contract_status.name:
            existing = db.query(ContractStatus).filter(
                ContractStatus.name == contract_status_data.name,
                ContractStatus.company_id == current_user.company_id,
                ContractStatus.id != contract_status_id
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contract status with this name already exists"
                )
        
        # Update fields
        update_data = contract_status_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contract_status, field, value)
        
        contract_status.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(contract_status)
        
        contract_status_dict = {
            "id": contract_status.id,
            "name": contract_status.name,
            "description": contract_status.description,
            "color": contract_status.color,
            "company_id": contract_status.company_id,
            "created_at": contract_status.created_at.isoformat(),
            "updated_at": contract_status.updated_at.isoformat()
        }
        
        return ContractStatusResponse(**contract_status_dict)

    @staticmethod
    def delete_contract_status(contract_status_id: int, current_user: User, db: Session) -> bool:
        contract_status = db.query(ContractStatus).filter(
            ContractStatus.id == contract_status_id,
            ContractStatus.company_id == current_user.company_id
        ).first()
        
        if not contract_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract status not found"
            )
        
        db.delete(contract_status)
        db.commit()
        return True
