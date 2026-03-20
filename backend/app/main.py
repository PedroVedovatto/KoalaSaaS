from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
from sqlalchemy.orm import Session
from .database import engine, Base, get_db, init_database
from .routers import auth, contracts, alerts, settings
# from .routers import users  # Temporarily commented out
import os

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
