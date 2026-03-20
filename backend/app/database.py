from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Use absolute path for database file
_DATABASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "koalasaas_users.db"))
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DATABASE_PATH}")

print(f"🗄️ Database path: {_DATABASE_PATH}")
print(f"🔗 Database URL: {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {},
    echo=True  # Show SQL queries for debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database with admin user"""
    from .models import User, Company
    from .services.auth import AuthService
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = SessionLocal()
    
    try:
        # Create default company if not exists
        company = db.query(Company).filter(Company.name == 'KoalaSaaS').first()
        if not company:
            company = Company(name='KoalaSaaS')
            db.add(company)
            db.commit()
            db.refresh(company)
            print(f"✅ Created company: {company.name}")
        
        # Create admin user if not exists
        admin_user = db.query(User).filter(User.email == 'admin@koalasaas.com').first()
        if not admin_user:
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
            print(f"✅ Created admin user: {admin_user.email}")
        
        # Create test user if not exists
        test_user = db.query(User).filter(User.email == 'teste@koalasaas.com').first()
        if not test_user:
            test_user = User(
                email='teste@koalasaas.com',
                username='teste',
                full_name='Usuário Teste',
                hashed_password=AuthService.get_password_hash('temp123'),
                role='member',
                is_active=True,
                company_id=company.id
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ Created test user: {test_user.email}")
        
        print(f"🎉 Database initialized successfully!")
        print(f"📊 Total users: {db.query(User).count()}")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()
