#!/usr/bin/env python3
"""
Script to promote all existing users to admin role
Run this script to update all users in the database to have admin privileges
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models import User
from app.services.users import UsersService

def promote_all_users():
    """Promote all existing users to admin role"""
    print("🔧 Promoting all users to admin role...")
    
    # Create database session
    with Session(engine) as db:
        try:
            # Get all users before update
            all_users = db.query(User).all()
            print(f"📊 Found {len(all_users)} users in database")
            
            # Show users before update
            print("\n📋 Users before update:")
            for user in all_users:
                print(f"   - {user.username} ({user.email}) - Role: {user.role}")
            
            # Promote all users to admin
            promoted_count = UsersService.promote_all_users_to_admin(db)
            
            # Show users after update
            print(f"\n✅ Successfully promoted {promoted_count} users to admin role!")
            
            # Verify the update
            updated_users = db.query(User).all()
            print("\n📋 Users after update:")
            for user in updated_users:
                print(f"   - {user.username} ({user.email}) - Role: {user.role}")
            
            print(f"\n🎉 All users now have admin privileges!")
            
        except Exception as e:
            print(f"❌ Error promoting users: {e}")
            raise

if __name__ == "__main__":
    promote_all_users()
