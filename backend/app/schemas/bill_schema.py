from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict
from .cafe_schema import CafeOut


class BillBase(BaseModel):
    cafe_id: Optional[int] = None
    title: Optional[str] = "Café Bill"
    total_amount: float = 0.0
    payment_mode: str = "cash"
    # Rich JSON: { items: [{name, price, assignedTo[]}], splits: [{name, amount}] }
    participants: Any = {}


class BillCreate(BillBase):
    pass


class BillUpdate(BaseModel):
    title: Optional[str] = None
    payment_mode: Optional[str] = None


class BillOut(BillBase):
    id: int
    creator_id: int
    created_at: datetime
    cafe: Optional[CafeOut] = None
    model_config = ConfigDict(from_attributes=True)
