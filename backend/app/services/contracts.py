from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status, UploadFile, File
from datetime import datetime, date, timedelta
from typing import List, Optional
import os

from ..models import Contract, User, Company, Alert, AlertTypeEnum, AlertSeverityEnum, ContractStatusEnum
from ..schemas.contract import ContractCreate, ContractUpdate, ContractResponse, DashboardStatsResponse

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ContractService:
    
    @staticmethod
    def get_contracts(
        db: Session, 
        current_user: User,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        contract_type: Optional[str] = None
    ) -> List[ContractResponse]:
        query = db.query(Contract).filter(Contract.company_id == current_user.company_id)

        if search:
            query = query.filter(
                or_(
                    Contract.name.ilike(f"%{search}%"),
                    Contract.description.ilike(f"%{search}%")
                )
            )

        if status:
            try:
                status_enum = ContractStatusEnum(status)
                query = query.filter(Contract.status == status_enum)
            except ValueError:
                # Invalid status, return empty result
                return []

        if contract_type:
            query = query.filter(Contract.contract_type == contract_type)

        contracts = query.offset(skip).limit(limit).all()

        # Add alerts for expiring contracts
        result = []
        for contract in contracts:
            today = date.today()
            days_until_expiry = (contract.end_date - today).days if contract.end_date else None
            alert = None

            # Add alert if contract expires in 30 days or is expired
            if contract.end_date:
                if days_until_expiry < 0:
                    alert = "Contrato expirado"
                elif days_until_expiry <= contract.cancel_days_before:
                    alert = f"Contrato expira em {days_until_expiry} dias"
                elif days_until_expiry <= 30:
                    alert = f"Contrato expira em {days_until_expiry} dias"

            contract_data = {
                "id": contract.id,
                "name": contract.name,
                "contract_type": contract.contract_type,
                "description": contract.description,
                "value": contract.value,
                "billing_cycle": contract.billing_cycle.value if contract.billing_cycle else None,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "status": contract.status.value,
                "auto_renew": contract.auto_renew,
                "cancel_days_before": contract.cancel_days_before,
                "file_path": contract.file_path,
                "company_id": contract.company_id,
                "created_by": contract.created_by,
                "created_at": contract.created_at,
                "updated_at": contract.updated_at,
                "days_until_expiry": days_until_expiry,
                "alert": alert
            }

            result.append(ContractResponse(**contract_data))

        return result

    @staticmethod
    def get_contract(db: Session, contract_id: int, current_user: User) -> ContractResponse:
        contract = db.query(Contract).filter(
            Contract.id == contract_id,
            Contract.company_id == current_user.company_id
        ).first()
        
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )
        
        # Calculate days_until_expiry and alert
        today = date.today()
        days_until_expiry = (contract.end_date - today).days if contract.end_date else None
        alert = None
        
        if contract.end_date:
            if days_until_expiry < 0:
                alert = "Contrato expirado"
            elif days_until_expiry <= contract.cancel_days_before:
                alert = f"Contrato expira em {days_until_expiry} dias"
            elif days_until_expiry <= 30:
                alert = f"Contrato expira em {days_until_expiry} dias"

        # Create response with calculated fields
        contract_dict = {
            "id": contract.id,
            "name": contract.name,
            "description": contract.description,
            "value": contract.value,
            "billing_cycle": contract.billing_cycle.value if contract.billing_cycle else None,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "auto_renew": contract.auto_renew,
            "cancel_days_before": contract.cancel_days_before,
            "contract_type": contract.contract_type,
            "status": contract.status.value,
            "company_id": contract.company_id,
            "created_by": contract.created_by,
            "created_at": contract.created_at,
            "updated_at": contract.updated_at,
            "file_path": contract.file_path,
            "days_until_expiry": days_until_expiry,
            "alert": alert
        }
        
        return ContractResponse.model_validate(contract_dict)

    @staticmethod
    def create_contract(
        contract_data: ContractCreate,
        file: Optional[UploadFile],
        current_user: User,
        db: Session
    ) -> ContractResponse:
        # Handle file upload
        file_path = None
        if file:
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"{datetime.utcnow().timestamp()}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)

            with open(file_path, "wb") as buffer:
                content = file.file.read()
                buffer.write(content)

        contract = Contract(
            name=contract_data.name,
            contract_type=contract_data.contract_type,
            description=contract_data.description,
            value=contract_data.value,
            billing_cycle=contract_data.billing_cycle,
            start_date=contract_data.start_date,
            end_date=contract_data.end_date,
            auto_renew=contract_data.auto_renew,
            cancel_days_before=contract_data.cancel_days_before,
            file_path=file_path,
            company_id=current_user.company_id,
            created_by=current_user.id
        )

        db.add(contract)
        db.commit()
        db.refresh(contract)

        # Calculate days_until_expiry and alert
        today = date.today()
        days_until_expiry = (contract.end_date - today).days
        alert = None
        
        if days_until_expiry < 0:
            alert = "Contrato expirado"
        elif days_until_expiry <= contract.cancel_days_before:
            alert = f"Contrato expira em {days_until_expiry} dias"
        elif days_until_expiry <= 30:
            alert = f"Contrato expira em {days_until_expiry} dias"

        # Create response with calculated fields
        contract_dict = {
            "id": contract.id,
            "name": contract.name,
            "description": contract.description,
            "value": contract.value,
            "billing_cycle": contract.billing_cycle,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "auto_renew": contract.auto_renew,
            "cancel_days_before": contract.cancel_days_before,
            "contract_type": contract.contract_type,
            "status": contract.status,
            "company_id": contract.company_id,
            "created_by": contract.created_by,
            "created_at": contract.created_at,
            "updated_at": contract.updated_at,
            "file_path": contract.file_path,
            "days_until_expiry": days_until_expiry,
            "alert": alert
        }
        
        return ContractResponse.model_validate(contract_dict)

    @staticmethod
    def update_contract(
        contract_id: int,
        contract_data: ContractUpdate,
        current_user: User,
        db: Session
    ) -> ContractResponse:
        contract = db.query(Contract).filter(
            Contract.id == contract_id,
            Contract.company_id == current_user.company_id
        ).first()
        
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )

        # Update fields
        update_data = contract_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contract, field, value)
        
        contract.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(contract)

        # Calculate days_until_expiry and alert
        today = date.today()
        days_until_expiry = (contract.end_date - today).days if contract.end_date else None
        alert = None
        
        if contract.end_date:
            if days_until_expiry < 0:
                alert = "Contrato expirado"
            elif days_until_expiry <= contract.cancel_days_before:
                alert = f"Contrato expira em {days_until_expiry} dias"
            elif days_until_expiry <= 30:
                alert = f"Contrato expira em {days_until_expiry} dias"

        # Create response with calculated fields
        contract_dict = {
            "id": contract.id,
            "name": contract.name,
            "description": contract.description,
            "value": contract.value,
            "billing_cycle": contract.billing_cycle.value if contract.billing_cycle else None,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "auto_renew": contract.auto_renew,
            "cancel_days_before": contract.cancel_days_before,
            "contract_type": contract.contract_type,
            "status": contract.status.value,
            "company_id": contract.company_id,
            "created_by": contract.created_by,
            "created_at": contract.created_at,
            "updated_at": contract.updated_at,
            "file_path": contract.file_path,
            "days_until_expiry": days_until_expiry,
            "alert": alert
        }
        
        return ContractResponse.model_validate(contract_dict)

    @staticmethod
    def delete_contract(contract_id: int, current_user: User, db: Session) -> bool:
        contract = db.query(Contract).filter(
            Contract.id == contract_id,
            Contract.company_id == current_user.company_id
        ).first()
        
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )

        # Delete file if exists
        if contract.file_path and os.path.exists(contract.file_path):
            os.remove(contract.file_path)

        db.delete(contract)
        db.commit()
        return True

    @staticmethod
    def get_dashboard_stats(current_user: User, db: Session) -> DashboardStatsResponse:
        company_id = current_user.company_id
        today = date.today()
        
        # Total contracts
        total_contracts = db.query(Contract).filter(Contract.company_id == company_id).count()
        
        # Active contracts
        active_contracts = db.query(Contract).filter(
            Contract.company_id == company_id,
            Contract.status == ContractStatusEnum.ativo
        ).count()
        
        # Expired contracts
        expired = db.query(Contract).filter(
            Contract.company_id == company_id,
            Contract.end_date < today
        ).count()
        
        # Expiring soon (next 30 days)
        thirty_days_from_now = today + timedelta(days=30)
        expiring_soon = db.query(Contract).filter(
            Contract.company_id == company_id,
            Contract.end_date >= today,
            Contract.end_date <= thirty_days_from_now,
            Contract.status == ContractStatusEnum.ativo
        ).count()
        
        # Total value
        total_value = db.query(func.sum(Contract.value)).filter(
            Contract.company_id == company_id,
            Contract.value.isnot(None)
        ).scalar() or 0.0
        
        # Potential savings (estimated)
        potential_savings = total_value * 0.05  # 5% estimated savings

        return DashboardStatsResponse(
            total_contracts=total_contracts,
            active_contracts=active_contracts,
            expired=expired,
            expiring_soon=expiring_soon,
            total_value=total_value,
            potential_savings=potential_savings
        )
