from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date, timedelta
from typing import List, Optional

from ..models import Contract, Alert, User, AlertTypeEnum, AlertSeverityEnum
from ..schemas.alert import AlertResponse, AlertListResponse

class AlertService:
    
    @staticmethod
    def generate_daily_alerts(db: Session) -> int:
        """
        Background job: Check all contracts and generate alerts
        Returns number of new alerts created
        """
        today = date.today()
        thirty_days_from_now = today + timedelta(days=30)
        new_alerts_count = 0

        # Get all active contracts
        active_contracts = db.query(Contract).filter(Contract.status == 'ativo').all()
        
        for contract in active_contracts:
            alerts_created = []
            
            # Check expiration alerts
            days_until_expiry = (contract.end_date - today).days
            
            if days_until_expiry < 0:
                # Contract expired
                if not AlertService._alert_exists(db, contract.id, AlertTypeEnum.expiration):
                    alert = Alert(
                        contract_id=contract.id,
                        alert_type=AlertTypeEnum.expiration,
                        severity=AlertSeverityEnum.critical,
                        message=f"Contrato '{contract.name}' expirou em {contract.end_date.strftime('%d/%m/%Y')}",
                        due_date=datetime.combine(contract.end_date, datetime.min.time())
                    )
                    db.add(alert)
                    alerts_created.append(alert)
                    
            elif days_until_expiry <= contract.cancel_days_before:
                # Cancellation deadline approaching
                if not AlertService._alert_exists(db, contract.id, AlertTypeEnum.cancellation_deadline):
                    alert = Alert(
                        contract_id=contract.id,
                        alert_type=AlertTypeEnum.cancellation_deadline,
                        severity=AlertSeverityEnum.high,
                        message=f"Prazo para cancelar '{contract.name}' termina em {days_until_expiry} dias",
                        due_date=datetime.combine(today + timedelta(days=contract.cancel_days_before), datetime.min.time())
                    )
                    db.add(alert)
                    alerts_created.append(alert)
                    
            elif days_until_expiry <= 30:
                # Renewal upcoming
                if not AlertService._alert_exists(db, contract.id, AlertTypeEnum.renewal_upcoming):
                    severity = AlertSeverityEnum.medium if days_until_expiry > 7 else AlertSeverityEnum.high
                    alert = Alert(
                        contract_id=contract.id,
                        alert_type=AlertTypeEnum.renewal_upcoming,
                        severity=severity,
                        message=f"Contrato '{contract.name}' expira em {days_until_expiry} dias",
                        due_date=datetime.combine(contract.end_date, datetime.min.time())
                    )
                    db.add(alert)
                    alerts_created.append(alert)
            
            new_alerts_count += len(alerts_created)
        
        if new_alerts_count > 0:
            db.commit()
            
        return new_alerts_count

    @staticmethod
    def _alert_exists(db: Session, contract_id: int, alert_type: AlertTypeEnum) -> bool:
        """Check if an alert of this type already exists for this contract"""
        existing = db.query(Alert).filter(
            and_(
                Alert.contract_id == contract_id,
                Alert.alert_type == alert_type,
                Alert.is_read == False
            )
        ).first()
        return existing is not None

    @staticmethod
    def get_user_alerts(
        db: Session,
        current_user: User,
        unread_only: bool = False,
        limit: int = 50
    ) -> AlertListResponse:
        """Get alerts for user's company contracts"""
        query = db.query(Alert).join(Contract).filter(
            Contract.company_id == current_user.company_id
        )
        
        if unread_only:
            query = query.filter(Alert.is_read == False)
            
        alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
        
        unread_count = db.query(Alert).join(Contract).filter(
            Contract.company_id == current_user.company_id,
            Alert.is_read == False
        ).count()
        
        return AlertListResponse(
            alerts=[AlertResponse.model_validate(alert) for alert in alerts],
            unread_count=unread_count
        )

    @staticmethod
    def mark_alert_as_read(alert_id: int, current_user: User, db: Session) -> AlertResponse:
        """Mark an alert as read"""
        alert = db.query(Alert).join(Contract).filter(
            Alert.id == alert_id,
            Contract.company_id == current_user.company_id
        ).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        alert.is_read = True
        alert.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)
        
        return AlertResponse.model_validate(alert)

    @staticmethod
    def mark_all_alerts_as_read(current_user: User, db: Session) -> int:
        """Mark all alerts as read for user's company"""
        count = db.query(Alert).join(Contract).filter(
            Contract.company_id == current_user.company_id,
            Alert.is_read == False
        ).update({"is_read": True, "updated_at": datetime.utcnow()})
        
        db.commit()
        return count

    @staticmethod
    def delete_old_alerts(db: Session, days_old: int = 90) -> int:
        """Clean up old read alerts"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        count = db.query(Alert).filter(
            Alert.is_read == True,
            Alert.updated_at < cutoff_date
        ).delete()
        
        db.commit()
        return count
