from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.cafe_schema import CafeOut
from app.schemas.social_schema import CommentOut, LikeOut
from app.schemas.user_schema import UserOut


class LogBase(BaseModel):
    cafe_id: int
    text: Optional[str] = None
    photos: str = ""  # Comma separated strings for simplicity
    menu_photo: str = ""
    rating: Optional[float] = None
    wifi_speed: Optional[str] = ""
    plug_rating: float = 0.0
    vibe_tags: List[str] = []


class LogCreate(LogBase):
    pass


class LogOut(LogBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserOut] = None
    cafe: Optional[CafeOut] = None
    likes: List[LikeOut] = []
    comments: List[CommentOut] = []

    model_config = ConfigDict(from_attributes=True)
