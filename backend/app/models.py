from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean, Date, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum

class BillingCycleEnum(enum.Enum):
    monthly = "monthly"
    yearly = "yearly"
    quarterly = "quarterly"
    onetime = "onetime"

class ContractStatusEnum(enum.Enum):
    ativo = "ativo"
    encerrado = "encerrado"
    cancelado = "cancelado"

class AlertTypeEnum(enum.Enum):
    renewal_upcoming = "renewal_upcoming"
    expiration = "expiration"
    cancellation_deadline = "cancellation_deadline"

class AlertSeverityEnum(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class UserRoleEnum(enum.Enum):
    admin = "admin"
    member = "member"

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cnpj = Column(String(20), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="company")
    contracts = relationship("Contract", back_populates="company")
    contract_types = relationship("ContractType", back_populates="company")
    contract_statuses = relationship("ContractStatus", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    role = Column(SQLEnum(UserRoleEnum), default=UserRoleEnum.member)
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="users")
    created_contracts = relationship("Contract", foreign_keys="Contract.created_by", back_populates="creator")

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contract_type = Column(String(100), nullable=False)  # aluguel, serviço, fornecedor, etc
    description = Column(Text)
    value = Column(Float)
    billing_cycle = Column(SQLEnum(BillingCycleEnum), default=BillingCycleEnum.onetime)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SQLEnum(ContractStatusEnum), default=ContractStatusEnum.ativo)
    auto_renew = Column(Boolean, default=False)
    cancel_days_before = Column(Integer, default=30)
    file_path = Column(String(500))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="contracts")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_contracts")
    alerts = relationship("Alert", back_populates="contract")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    alert_type = Column(SQLEnum(AlertTypeEnum), nullable=False)
    severity = Column(SQLEnum(AlertSeverityEnum), nullable=False)
    message = Column(String(500), nullable=False)
    due_date = Column(DateTime)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    contract = relationship("Contract", back_populates="alerts")

class ContractType(Base):
    __tablename__ = "contract_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=False, default="#3B82F6")
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="contract_types")

class ContractStatus(Base):
    __tablename__ = "contract_statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=False, default="#10B981")
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="contract_statuses")
