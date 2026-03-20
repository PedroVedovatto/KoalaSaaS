from sqlalchemy.orm import Session
from sqlalchemy import and_, update
from passlib.context import CryptContext
from typing import List

from ..models import User, UserRoleEnum
from ..schemas.users import UserCreate, UserUpdate, UserPasswordChange
from ..services.auth import AuthService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UsersService:
    @staticmethod
    def get_users(db: Session, current_user: User) -> List[User]:
        """Get all users for current user's company"""
        return db.query(User).filter(
            User.company_id == current_user.company_id
        ).all()

    @staticmethod
    def get_user(db: Session, user_id: int, current_user: User) -> User:
        """Get a specific user by ID"""
        user = db.query(User).filter(
            and_(
                User.id == user_id,
                User.company_id == current_user.company_id
            )
        ).first()
        if not user:
            raise ValueError("User not found")
        return user

    @staticmethod
    def promote_all_users_to_admin(db: Session) -> int:
        """Update all existing users to admin role"""
        result = db.execute(
            update(User)
            .where(User.role != 'admin')
            .values(role='admin')
        )
        db.commit()
        return result.rowcount

    @staticmethod
    def create_user(user_data: UserCreate, current_user: User, db: Session) -> User:
        """Create a new user"""
        # Check if username already exists in company
        existing_user = db.query(User).filter(
            and_(
                User.username == user_data.username,
                User.company_id == current_user.company_id
            )
        ).first()
        if existing_user:
            raise ValueError("Username already exists in this company")

        # Check if email already exists in company
        existing_email = db.query(User).filter(
            and_(
                User.email == user_data.email,
                User.company_id == current_user.company_id
            )
        ).first()
        if existing_email:
            raise ValueError("Email already exists in this company")

        # Create new user
        hashed_password = AuthService.get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=user_data.is_active,
            hashed_password=hashed_password,
            company_id=current_user.company_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(user_id: int, user_data: UserUpdate, current_user: User, db: Session) -> User:
        """Update an existing user"""
        user = UsersService.get_user(db, user_id, current_user)

        # Check username uniqueness if being updated
        if user_data.username and user_data.username != user.username:
            existing_user = db.query(User).filter(
                and_(
                    User.username == user_data.username,
                    User.company_id == current_user.company_id,
                    User.id != user_id
                )
            ).first()
            if existing_user:
                raise ValueError("Username already exists in this company")

        # Check email uniqueness if being updated
        if user_data.email and user_data.email != user.email:
            existing_email = db.query(User).filter(
                and_(
                    User.email == user_data.email,
                    User.company_id == current_user.company_id,
                    User.id != user_id
                )
            ).first()
            if existing_email:
                raise ValueError("Email already exists in this company")

        # Update user fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_user(user_id: int, current_user: User, db: Session) -> None:
        """Delete a user"""
        user = UsersService.get_user(db, user_id, current_user)
        db.delete(user)
        db.commit()

    @staticmethod
    def toggle_user_status(user_id: int, current_user: User, db: Session) -> User:
        """Toggle user active status"""
        user = UsersService.get_user(db, user_id, current_user)
        user.is_active = not user.is_active
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(user_id: int, password_data: UserPasswordChange, current_user: User, db: Session) -> User:
        """Change user password"""
        user = UsersService.get_user(db, user_id, current_user)
        
        # If user is changing their own password, verify current password
        if current_user.id == user_id and password_data.current_password:
            if not pwd_context.verify(password_data.current_password, user.hashed_password):
                raise ValueError("Current password is incorrect")
        
        # Update password
        user.hashed_password = AuthService.get_password_hash(password_data.new_password)
        db.commit()
        db.refresh(user)
        return user
