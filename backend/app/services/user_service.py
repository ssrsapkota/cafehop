import os
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.bill import Bill
from app.models.log import Log
from app.models.notification import Notification
from app.models.social import Follow
from app.models.favorite import Favorite
from app.models.cafe_list import CafeList
from app.models.user import User
from app.schemas.user_schema import UserProfileUpdate


def get_all_users(db: Session):
    return db.query(User).all()


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user_profile(db: Session, user: User, user_in: UserProfileUpdate):
    if user_in.name is not None:
        user.name = user_in.name
    if user_in.bio is not None:
        user.bio = user_in.bio
    if user_in.location is not None:
        user.location = user_in.location
    if user_in.avatar is not None:
        user.avatar = user_in.avatar
    db.commit()
    db.refresh(user)
    return user


async def upload_user_avatar(db: Session, user: User, file, read_bytes):
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"avatar_{user.id}_{uuid.uuid4()}.{ext}"
    filepath = os.path.join("static", "uploads", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(read_bytes)
    user.avatar = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return False
        
    try:
        # Cascade manual delete for all foreign relationships
        db.query(Notification).filter(or_(Notification.user_id == user_id, Notification.actor_id == user_id)).delete()
        db.query(Follow).filter(or_(Follow.follower_id == user_id, Follow.following_id == user_id)).delete()

        db.query(Favorite).filter(Favorite.user_id == user_id).delete()
        db.query(CafeList).filter(CafeList.user_id == user_id).delete()
        
        db.query(Log).filter(Log.user_id == user_id).delete()
        db.query(Bill).filter(Bill.creator_id == user_id).delete()
        
        db.delete(user)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Failed to delete user {user_id}: {e}")
        return False
