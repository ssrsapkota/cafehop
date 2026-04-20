from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class NotificationActor(BaseModel):
    id: int
    name: str | None = "User"
    avatar: str | None = None


class NotificationBase(BaseModel):
    type: str
    message: str
    is_read: bool = False
    metadata_json: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    user_id: int
    actor_id: Optional[int] = None


class NotificationOut(NotificationBase):
    id: int
    created_at: datetime
    actor: Optional[NotificationActor] = None

    class Config:
        from_attributes = True
