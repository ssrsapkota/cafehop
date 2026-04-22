from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification_schema import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=List[NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get notifications for the current user."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    # We need to manually populate the actor info in the response schema
    out = []
    for n in notifs:
        actor_data = None
        if n.actor_id:
            actor = db.query(User).filter(User.id == n.actor_id).first()
            if actor:
                actor_data = {
                    "id": actor.id,
                    "name": actor.name,
                    "avatar": actor.avatar,
                }
        out.append(
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "metadata_json": n.metadata_json,
                "created_at": n.created_at,
                "actor": actor_data,
            }
        )
    return out


@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_read(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All read"}
