from typing import List, Optional

from pydantic import BaseModel


class CafeBase(BaseModel):
    name: str
    area: Optional[str] = None
    city: str
    address: Optional[str] = None
    description: Optional[str] = None
    rating: float = 0.0
    price_level: Optional[str] = None
    has_wifi: bool = False
    has_outdoor: bool = False
    good_for_work: bool = False
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    website: Optional[str] = None
    contact_number: Optional[str] = None
    wifi_speed: Optional[str] = "Average"
    plug_rating: float = 0.0
    vibe_tags: List[str] = []


class CafeCreate(CafeBase):
    pass


class CafeOut(CafeBase):
    id: int

    class Config:
        from_attributes = True
