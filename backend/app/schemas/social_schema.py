from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user_schema import UserOut


class FollowBase(BaseModel):
    following_id: int


class FollowCreate(FollowBase):
    pass


class FollowOut(FollowBase):
    id: int
    follower_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LikeBase(BaseModel):
    log_id: int


class LikeCreate(LikeBase):
    pass


class LikeOut(LikeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    log_id: int
    text: str


class CommentCreate(CommentBase):
    pass


class CommentOut(CommentBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True
