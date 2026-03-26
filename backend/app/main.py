from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
from sqlalchemy.orm import Session
from .database import engine, Base, get_db, init_database
from .routers import auth, contracts, alerts, settings
# from .routers import users  # Temporarily commented out
import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# Initialize database with default users
init_database()

# Create database tables (redundant but safe)
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(
    title="KoalaSaaS API",
    description="Contract Management SaaS with Smart Alerts",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
# app.include_router(users.router, prefix="/api")  # Temporarily commented out

@app.get("/")
def root():
    return {
        "message": "KoalaSaaS API v2.0.0",
        "docs": "/docs",
        "features": [
            "Multi-tenant authentication",
            "Contract management",
            "Smart alerts system",
            "User management",
            "File uploads",
            "Dashboard analytics"
        ]
    }

@app.post("/sync-users")
def sync_users(db: Session = Depends(get_db)):
    """Temporarily sync mock users to database"""
    from .models import User, Company
    from .services.auth import AuthService
    
    # Create test company if not exists
    company = db.query(Company).filter(Company.name == 'Test Company').first()
    if not company:
        company = Company(name='Test Company')
        db.add(company)
        db.commit()
        db.refresh(company)
    
    # Create admin user if not exists
    admin_user = db.query(User).filter(User.email == 'admin@gmail.com').first()
    if not admin_user:
        admin_user = User(
            email='admin@gmail.com',
            username='admin',
            full_name='Administrador',
            hashed_password=AuthService.get_password_hash('admin123'),
            role='admin',
            company_id=company.id
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    
    return {"message": "Users synced successfully", "users_count": db.query(User).count()}

@app.post("/create-user")
def create_user_from_frontend(user_data: dict, db: Session = Depends(get_db)):
    """Create user from frontend mock data"""
    from .models import User, Company
    from .services.auth import AuthService
    
    print(f"🔍 DEBUG: Received user_data: {user_data}")
    print(f"🔍 DEBUG: Password field: {user_data.get('password')}")
    print(f"🔍 DEBUG: Password type: {type(user_data.get('password'))}")
    print(f"🔍 DEBUG: All keys: {list(user_data.keys())}")
    
    # Get or create company
    company = db.query(Company).filter(Company.name == 'Test Company').first()
    if not company:
        company = Company(name='Test Company')
        db.add(company)
        db.commit()
        db.refresh(company)
    
    # Check if user already exists by email or username
    existing_user = db.query(User).filter(
        (User.email == user_data.get('email')) | 
        (User.username == user_data.get('username'))
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.get('email'):
            return {"message": "Email já cadastrado", "user_id": existing_user.id, "status": "exists"}
        else:
            return {"message": "Username já cadastrado", "user_id": existing_user.id, "status": "exists"}
    
    # Create new user with the password user actually typed - NO MORE temp123 OVERRIDE!
    password = user_data.get('password')
    
    # REQUIRE password - no more default temp123
    if not password or password == '':
        return {"message": "Senha é obrigatória!", "status": "error", "error": "PASSWORD_REQUIRED"}
    
    print(f"✅ Using user-provided password: {password}")
    print(f"🔧 Creating user {user_data.get('email')} with password: {password}")
    
    new_user = User(
        email=user_data.get('email'),
        username=user_data.get('username'),
        full_name=user_data.get('full_name'),
        hashed_password=AuthService.get_password_hash(password),
        role=user_data.get('role', 'member'),
        is_active=user_data.get('is_active', True),
        company_id=company.id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Test login immediately to verify it works
    try:
        test_login = AuthService.authenticate_user(user_data.get('email'), password, db)
        if test_login:
            print(f"✅ Login test SUCCESS for {user_data.get('email')}")
        else:
            print(f"❌ Login test FAILED for {user_data.get('email')}")
    except Exception as e:
        print(f"❌ Login test ERROR: {e}")
    
    return {
        "message": "Usuário criado com sucesso", 
        "user_id": new_user.id, 
        "status": "created",
        "password": password,  # Return the ACTUAL password used
        "login_test": "success" if AuthService.authenticate_user(user_data.get('email'), password, db) else "failed"
    }

@app.put("/update-user/{user_id}")
def update_user(user_id: int, user_data: dict, db: Session = Depends(get_db)):
    """Update existing user"""
    from .models import User, Company
    from .services.auth import AuthService
    
    print(f"🔧 DEBUG: Updating user {user_id} with data: {user_data}")
    
    # Get existing user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"message": "Usuário não encontrado", "status": "error"}
    
    # Check if email/username conflicts with other users
    if user_data.get('email') and user_data.get('username'):
        existing_user = db.query(User).filter(
            (User.email == user_data.get('email')) | 
            (User.username == user_data.get('username')),
            User.id != user_id
        ).first()
        
        if existing_user:
            if existing_user.email == user_data.get('email'):
                return {"message": "Email já cadastrado por outro usuário", "status": "conflict"}
            else:
                return {"message": "Username já cadastrado por outro usuário", "status": "conflict"}
    
    # Update user fields
    if user_data.get('email'):
        user.email = user_data.get('email')
    if user_data.get('username'):
        user.username = user_data.get('username')
    if user_data.get('full_name'):
        user.full_name = user_data.get('full_name')
    if user_data.get('role'):
        user.role = user_data.get('role')
    if 'is_active' in user_data:
        user.is_active = user_data.get('is_active')
    
    # Update password only if provided
    if user_data.get('password') and user_data.get('password') != '':
        user.hashed_password = AuthService.get_password_hash(user_data.get('password'))
        print(f"🔐 Password updated for user {user_id}")
    
    db.commit()
    db.refresh(user)
    
    print(f"✅ User {user_id} updated successfully")
    
    return {
        "message": "Usuário atualizado com sucesso",
        "status": "success",
        "user_id": user.id,
        "updated_fields": {
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@app.get("/list-users")
def list_all_users(db: Session = Depends(get_db)):
    """List all users for debugging"""
    from .models import User
    
    users = db.query(User).all()
    user_list = []
    for user in users:
        user_list.append({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "company_id": user.company_id,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return {"users": user_list, "total": len(user_list)}

@app.delete("/delete-user/{user_id}")
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    """Delete user endpoint"""
    from .models import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"message": "User not found", "status": "error"}
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully", "status": "success"}

@app.post("/create-test-user")
def create_test_user(db: Session = Depends(get_db)):
    """Create a test user immediately for testing"""
    from .models import User, Company
    from .services.auth import AuthService
    
    # Get or create company
    company = db.query(Company).filter(Company.name == 'Test Company').first()
    if not company:
        company = Company(name='Test Company')
        db.add(company)
        db.commit()
        db.refresh(company)
    
    # Delete existing test user if exists
    existing = db.query(User).filter(User.email == 'testelogin@demo.com').first()
    if existing:
        db.delete(existing)
        db.commit()
    
    # Create new test user
    test_user = User(
        email='testelogin@demo.com',
        username='testelogin',
        full_name='Teste Login Funcionando',
        hashed_password=AuthService.get_password_hash('temp123'),
        role='member',
        is_active=True,
        company_id=company.id
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Test login
    login_result = AuthService.authenticate_user('testelogin@demo.com', 'temp123', db)
    
    return {
        "message": "Test user created successfully",
        "email": "testelogin@demo.com",
        "password": "temp123",
        "user_id": test_user.id,
        "login_test": "success" if login_result else "failed",
        "instructions": "Use these credentials to test login in the frontend"
    }

@app.get("/test-all-logins")
def test_all_logins(db: Session = Depends(get_db)):
    """Test all users and show working credentials"""
    from .models import User
    from .services.auth import AuthService
    
    users = db.query(User).all()
    results = []
    
    for user in users:
        # Try common passwords
        test_passwords = ['temp123', 'admin123', 'password', '123456']
        working_password = None
        
        for password in test_passwords:
            if AuthService.authenticate_user(user.email, password, db):
                working_password = password
                break
        
        results.append({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "working_password": working_password,
            "login_status": "✅ WORKS" if working_password else "❌ NO PASSWORD FOUND"
        })
    
    return {
        "message": "Login test results for all users",
        "users": results,
        "total": len(results),
        "working_count": len([r for r in results if r["working_password"]])
    }

@app.get("/api-test")
def api_test():
    """Simple API test for frontend"""
    return {"message": "API is working!", "status": "success", "timestamp": "2025-03-20"}

def generate_alerts_for_contract(contract, db):
    """Generate alerts for a contract based on expiration dates"""
    from .models import Alert, AlertTypeEnum, AlertSeverityEnum
    
    today = datetime.now().date()
    end_date = contract.end_date
    
    # Calculate days until expiration
    days_until = (end_date - today).days
    
    alerts_created = []
    
    # Delete existing alerts for this contract to avoid duplicates
    existing_alerts = db.query(Alert).filter(Alert.contract_id == contract.id).all()
    for alert in existing_alerts:
        db.delete(alert)
    
    # Generate alerts based on days until expiration
    if days_until <= 0:
        # Contract expired
        alerts_created.append(Alert(
            contract_id=contract.id,
            alert_type=AlertTypeEnum.expiration,
            severity=AlertSeverityEnum.critical,
            message=f"Contrato '{contract.name}' EXPIROU em {end_date.strftime('%d/%m/%Y')}",
            due_date=datetime.combine(end_date, datetime.min.time())
        ))
    elif days_until <= 7:
        # 7 days or less - critical
        alerts_created.append(Alert(
            contract_id=contract.id,
            alert_type=AlertTypeEnum.expiration,
            severity=AlertSeverityEnum.critical,
            message=f"Contrato '{contract.name}' expira em {days_until} dias ({end_date.strftime('%d/%m/%Y')})",
            due_date=datetime.combine(end_date, datetime.min.time())
        ))
    elif days_until <= 15:
        # 15 days or less - high
        alerts_created.append(Alert(
            contract_id=contract.id,
            alert_type=AlertTypeEnum.expiration,
            severity=AlertSeverityEnum.high,
            message=f"Contrato '{contract.name}' expira em {days_until} dias ({end_date.strftime('%d/%m/%Y')})",
            due_date=datetime.combine(end_date, datetime.min.time())
        ))
    elif days_until <= 30:
        # 30 days or less - medium
        alerts_created.append(Alert(
            contract_id=contract.id,
            alert_type=AlertTypeEnum.expiration,
            severity=AlertSeverityEnum.medium,
            message=f"Contrato '{contract.name}' expira em {days_until} dias ({end_date.strftime('%d/%m/%Y')})",
            due_date=datetime.combine(end_date, datetime.min.time())
        ))
    elif days_until <= 60:
        # 60 days or less - low
        alerts_created.append(Alert(
            contract_id=contract.id,
            alert_type=AlertTypeEnum.renewal_upcoming,
            severity=AlertSeverityEnum.low,
            message=f"Contrato '{contract.name}' precisa de atenção em {days_until} dias ({end_date.strftime('%d/%m/%Y')})",
            due_date=datetime.combine(end_date, datetime.min.time())
        ))
    
    # Add all new alerts to database
    for alert in alerts_created:
        db.add(alert)
    
    db.commit()
    return len(alerts_created)

@app.get("/public-contract-types")
def get_public_contract_types(db: Session = Depends(get_db)):
    """Get all contract types without authentication for testing"""
    from .models import ContractType
    
    contract_types = db.query(ContractType).all()
    type_list = []
    
    for ct in contract_types:
        type_list.append({
            "id": ct.id,
            "name": ct.name,
            "description": ct.description,
            "color": ct.color
        })
    
    return {
        "contract_types": type_list,
        "total": len(type_list)
    }

@app.get("/public-contracts")
def get_public_contracts(db: Session = Depends(get_db)):
    """Get all contracts without authentication for testing"""
    from .models import Contract, Company
    
    contracts = db.query(Contract).join(Company).all()
    contract_list = []
    
    for contract in contracts:
        contract_list.append({
            "id": contract.id,
            "name": contract.name,
            "contract_type": contract.contract_type,
            "description": contract.description,
            "value": contract.value,
            "billing_cycle": contract.billing_cycle.value if contract.billing_cycle else None,
            "start_date": contract.start_date.isoformat() if contract.start_date else None,
            "end_date": contract.end_date.isoformat() if contract.end_date else None,
            "status": contract.status.value if contract.status else None,
            "auto_renew": contract.auto_renew,
            "cancel_days_before": contract.cancel_days_before,
            "company_name": contract.company.name,
            "created_at": contract.created_at.isoformat() if contract.created_at else None
        })
    
    return {
        "contracts": contract_list,
        "total": len(contract_list)
    }

@app.get("/public-alerts")
def get_public_alerts(db: Session = Depends(get_db)):
    """Get all alerts without authentication for testing"""
    from .models import Alert, Contract
    
    alerts = db.query(Alert).join(Contract).all()
    alert_list = []
    
    for alert in alerts:
        alert_list.append({
            "id": alert.id,
            "contract_id": alert.contract_id,
            "contract_name": alert.contract.name,
            "alert_type": alert.alert_type.value,
            "severity": alert.severity.value,
            "message": alert.message,
            "due_date": alert.due_date.isoformat() if alert.due_date else None,
            "is_read": alert.is_read,
            "is_concern": alert.is_concern,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
            "contract_end_date": alert.contract.end_date.isoformat() if alert.contract.end_date else None
        })
    
    return {
        "alerts": alert_list,
        "total": len(alert_list)
    }

@app.post("/generate-alerts")
def generate_all_alerts(db: Session = Depends(get_db)):
    """Generate alerts for all active contracts"""
    from .models import Contract
    
    # Get all active contracts
    active_contracts = db.query(Contract).filter(Contract.status == 'ativo').all()
    
    total_alerts = 0
    for contract in active_contracts:
        alerts_count = generate_alerts_for_contract(contract, db)
        total_alerts += alerts_count
        print(f"📊 Generated {alerts_count} alerts for contract: {contract.name}")
    
    return {
        "message": f"Alerts generated for {len(active_contracts)} contracts",
        "total_alerts": total_alerts,
        "contracts_processed": len(active_contracts)
    }

@app.post("/add-concern-column")
def add_concern_column(db: Session = Depends(get_db)):
    """Add is_concern column to alerts table"""
    try:
        # Execute raw SQL to add the column
        from sqlalchemy import text
        db.execute(text("ALTER TABLE alerts ADD COLUMN is_concern BOOLEAN DEFAULT FALSE"))
        db.commit()
        
        return {
            "message": "Column is_concern added successfully",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        return {
            "message": f"Error adding column: {str(e)}",
            "status": "error"
        }

@app.put("/toggle-alert-concern/{alert_id}")
def toggle_alert_concern(alert_id: int, db: Session = Depends(get_db)):
    """Toggle alert concern status"""
    from .models import Alert
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"message": "Alert not found", "status": "error"}
    
    alert.is_concern = not alert.is_concern
    db.commit()
    
    return {
        "message": f"Alert concern status {'enabled' if alert.is_concern else 'disabled'}",
        "status": "success",
        "alert_id": alert.id,
        "is_concern": alert.is_concern
    }

@app.put("/mark-alert-read/{alert_id}")
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as read"""
    from .models import Alert
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"message": "Alert not found", "status": "error"}
    
    alert.is_read = True
    db.commit()
    
    return {
        "message": "Alert marked as read",
        "status": "success",
        "alert_id": alert.id
    }

@app.post("/clear-contracts")
def clear_contracts(db: Session = Depends(get_db)):
    """Clear all contracts but keep users and types"""
    from .models import Contract, Alert
    
    try:
        # Delete all alerts first
        db.query(Alert).delete()
        
        # Delete all contracts
        db.query(Contract).delete()
        
        db.commit()
        
        return {
            "message": "Contracts cleared successfully",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        return {
            "message": f"Error clearing contracts: {str(e)}",
            "status": "error"
        }

@app.post("/create-sample-contracts")
def create_sample_contracts(db: Session = Depends(get_db)):
    """Create sample contracts with different expiration dates"""
    from .models import Contract, Company, ContractType
    from datetime import date, timedelta
    
    # Get first company
    company = db.query(Company).first()
    if not company:
        return {"message": "No company found", "status": "error"}
    
    # Create sample contract types first
    sample_contract_types = [
        {
            "name": "Serviço",
            "description": "Contratos de prestação de serviços",
            "color": "#3B82F6"
        },
        {
            "name": "Software",
            "description": "Licenciamento de software",
            "color": "#10B981"
        },
        {
            "name": "Consultoria",
            "description": "Contratos de consultoria",
            "color": "#F59E0B"
        },
        {
            "name": "Aluguel",
            "description": "Contratos de aluguel de equipamentos",
            "color": "#8B5CF6"
        },
        {
            "name": "Manutenção",
            "description": "Contratos de manutenção preventiva",
            "color": "#EF4444"
        },
        {
            "name": "Seguro",
            "description": "Apólices de seguro",
            "color": "#10B981"
        }
    ]
    
    created_types = []
    for type_data in sample_contract_types:
        existing_type = db.query(ContractType).filter(ContractType.name == type_data["name"]).first()
        if not existing_type:
            contract_type = ContractType(
                name=type_data["name"],
                description=type_data["description"],
                color=type_data["color"],
                company_id=company.id
            )
            db.add(contract_type)
            created_types.append(type_data["name"])
            print(f"🏷️ Created contract type: {type_data['name']}")
    
    db.commit()
    
    # Sample contracts with different expiration dates
    sample_contracts = [
        {
            "name": "Aluguel de Escritório Principal",
            "contract_type": "Aluguel",
            "description": "Contrato de aluguel do escritório principal",
            "value": 5000.00,
            "billing_cycle": "monthly",
            "start_date": date.today() - timedelta(days=30),
            "end_date": date.today() + timedelta(days=7),  # 7 dias
            "status": "ativo",
            "auto_renew": True,
            "cancel_days_before": 30
        },
        {
            "name": "Software ERP Licenciamento",
            "contract_type": "Software",
            "description": "Licenciamento anual do sistema ERP",
            "value": 1200.00,
            "billing_cycle": "yearly",
            "start_date": date.today() - timedelta(days=350),
            "end_date": date.today() + timedelta(days=15),  # 15 dias
            "status": "ativo",
            "auto_renew": True,
            "cancel_days_before": 30
        },
        {
            "name": "Serviços de Limpeza Mensal",
            "contract_type": "Serviço",
            "description": "Contrato mensal de serviços de limpeza",
            "value": 800.00,
            "billing_cycle": "monthly",
            "start_date": date.today() - timedelta(days=60),
            "end_date": date.today() + timedelta(days=30),  # 30 dias
            "status": "ativo",
            "auto_renew": False,
            "cancel_days_before": 30
        },
        {
            "name": "Internet e Telefonia Empresarial",
            "contract_type": "Serviço",
            "description": "Contrato de serviços de internet e telefonia",
            "value": 350.00,
            "billing_cycle": "monthly",
            "start_date": date.today() - timedelta(days=90),
            "end_date": date.today() + timedelta(days=60),  # 60 dias
            "status": "ativo",
            "auto_renew": True,
            "cancel_days_before": 30
        },
        {
            "name": "Seguro Empresarial Anual",
            "contract_type": "Seguro",
            "description": "Apólice de seguro empresarial anual",
            "value": 2400.00,
            "billing_cycle": "yearly",
            "start_date": date.today() - timedelta(days=275),
            "end_date": date.today() + timedelta(days=90),  # 90 dias
            "status": "ativo",
            "auto_renew": True,
            "cancel_days_before": 30
        },
        {
            "name": "Consultoria Estratégica",
            "contract_type": "Consultoria",
            "description": "Contrato de consultoria que já expirou",
            "value": 1500.00,
            "billing_cycle": "onetime",
            "start_date": date.today() - timedelta(days=30),
            "end_date": date.today() - timedelta(days=1),  # Expirado
            "status": "encerrado",
            "auto_renew": False,
            "cancel_days_before": 30
        }
    ]
    
    created_contracts = []
    
    for contract_data in sample_contracts:
        # Check if contract already exists
        existing = db.query(Contract).filter(
            Contract.name == contract_data["name"]
        ).first()
        
        if not existing:
            contract = Contract(
                name=contract_data["name"],
                contract_type=contract_data["contract_type"],
                description=contract_data["description"],
                value=contract_data["value"],
                billing_cycle=contract_data["billing_cycle"],
                start_date=contract_data["start_date"],
                end_date=contract_data["end_date"],
                status=contract_data["status"],
                auto_renew=contract_data["auto_renew"],
                cancel_days_before=contract_data["cancel_days_before"],
                company_id=company.id,
                created_by=1  # Admin user
            )
            db.add(contract)
            created_contracts.append(contract_data["name"])
            print(f"📋 Created contract: {contract_data['name']}")
    
    db.commit()
    
    # Generate alerts for all contracts
    generate_all_alerts(db)
    
    return {
        "message": f"Created {len(created_contracts)} sample contracts and {len(created_types)} contract types",
        "contracts": created_contracts,
        "contract_types": created_types,
        "total_contracts": len(created_contracts)
    }

@app.post("/reset-database")
def reset_database(db: Session = Depends(get_db)):
    """Reset database completely - delete all users and start fresh"""
    from .models import User, Company
    from .services.auth import AuthService
    
    try:
        # Delete all users
        db.query(User).delete()
        
        # Delete all companies
        db.query(Company).delete()
        
        db.commit()
        
        # Create default company
        company = Company(name='KoalaSaaS')
        db.add(company)
        db.commit()
        db.refresh(company)
        
        # Create admin user
        admin_user = User(
            email='admin@koalasaas.com',
            username='admin',
            full_name='Administrador KoalaSaaS',
            hashed_password=AuthService.get_password_hash('admin123'),
            role='admin',
            is_active=True,
            company_id=company.id
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        return {
            "message": "Database reset successfully!",
            "status": "success",
            "admin_user": {
                "email": "admin@koalasaas.com",
                "password": "admin123",
                "role": "admin"
            },
            "instructions": "You can now create new users with any email/name you want!"
        }
        
    except Exception as e:
        db.rollback()
        return {
            "message": f"Error resetting database: {e}",
            "status": "error"
        }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
