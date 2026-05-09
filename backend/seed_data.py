#!/usr/bin/env python
"""
Script para popular o banco de dados com dados iniciais
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import ContractType, ContractStatus, Company
from app.database import SQLALCHEMY_DATABASE_URL, SessionLocal

def seed_database():
    """Populate database with initial data"""
    db = SessionLocal()
    
    try:
        # Find or create the default application company
        company = db.query(Company).filter(Company.name == 'KoalaSaaS').first()
        if not company:
            print("❌ Company 'KoalaSaaS' not found. Creating...")
            company = Company(name='KoalaSaaS')
            db.add(company)
            db.commit()
            db.refresh(company)
        
        print(f"✅ Using company: {company.name} (ID: {company.id})")
        
        # Define all contract types that should exist for the app company
        all_types_data = [
            ("Serviço", "Contratos de prestação de serviços", "#3B82F6"),
            ("Software", "Licenciamento de software", "#10B981"),
            ("Consultoria", "Contratos de consultoria", "#F59E0B"),
            ("Aluguel", "Contratos de aluguel de imóveis e equipamentos", "#8B5CF6"),
            ("Manutenção", "Contratos de manutenção preventiva e corretiva", "#EC4899"),
            ("Seguro", "Contratos de seguros diversos", "#06B6D4"),
            ("Fornecimento", "Contratos de fornecimento de produtos", "#14B8A6"),
            ("Suporte", "Contratos de suporte técnico", "#F97316"),
            ("Terceirização", "Contratos de terceirização e outsourcing", "#A855F7"),
        ]
        
        print("📝 Syncing contract types...")
        for type_name, type_desc, type_color in all_types_data:
            existing = db.query(ContractType).filter(
                ContractType.name == type_name,
                ContractType.company_id == 2
            ).first()
            
            if not existing:
                new_type = ContractType(
                    name=type_name,
                    description=type_desc,
                    color=type_color,
                    company_id=2
                )
                db.add(new_type)
                print(f"  ✅ Added: {type_name}")
            else:
                print(f"  ℹ️  Already exists: {type_name}")
        
        db.commit()
        final_types = db.query(ContractType).filter(ContractType.company_id == 2).all()
        print(f"✅ Total contract types: {len(final_types)}")
        
        # Check if contract statuses already exist
        existing_statuses = db.query(ContractStatus).filter(ContractStatus.company_id == 2).all()
        if not existing_statuses:
            print("📝 Inserting contract statuses...")
            contract_statuses = [
                ContractStatus(
                    name="ativo",
                    description="Contrato ativo e em vigor",
                    color="#10B981",
                    company_id=2
                ),
                ContractStatus(
                    name="pendente",
                    description="Aguardando aprovação",
                    color="#F59E0B",
                    company_id=2
                ),
                ContractStatus(
                    name="encerrado",
                    description="Contrato finalizado",
                    color="#6B7280",
                    company_id=2
                ),
            ]
            db.add_all(contract_statuses)
            db.commit()
            print(f"✅ Inserted {len(contract_statuses)} contract statuses")
        else:
            print(f"ℹ️  Contract statuses already exist: {len(existing_statuses)} statuses")
            
        print("🎉 Database seeding complete!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
