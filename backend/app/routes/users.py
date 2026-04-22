from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin_user, get_current_user
from app.models.user import User
from app.schemas.user_schema import UserOut, UserProfileUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    """Fetch all users (useful for friends list)"""
    return user_service.get_all_users(db)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Fetch user by id"""
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserOut)
def update_me(
    user_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile"""
    return user_service.update_user_profile(db, current_user, user_in)


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload avatar image and update user profile"""
    file_bytes = await file.read()
    return await user_service.upload_user_avatar(db, current_user, file, file_bytes)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a user, only admins can do this"""
    success = user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
