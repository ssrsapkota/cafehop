from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.cafe_schema import CafeOut


class CafeListItemBase(BaseModel):
    cafe_id: int


class CafeListItemOut(CafeListItemBase):
    id: int
    list_id: int
    added_at: datetime
    cafe: Optional[CafeOut] = None
    model_config = ConfigDict(from_attributes=True)


class CafeListBase(BaseModel):
    name: str
    is_public: bool = False


class CafeListCreate(CafeListBase):
    pass


class CafeListOut(CafeListBase):
    id: int
    user_id: int
    created_at: datetime
    items: List[CafeListItemOut] = []

    model_config = ConfigDict(from_attributes=True)
