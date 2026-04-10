from sqlalchemy import JSON, Boolean, Column, Float, Integer, String, Text

from app.core.database import Base


class Cafe(Base):
    __tablename__ = "cafes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    area = Column(String(255), index=True)
    city = Column(String(255), index=True)
    address = Column(String(500))
    description = Column(Text)
    rating = Column(Float, default=0.0)
    price_level = Column(String(50))
    has_wifi = Column(Boolean, default=False)
    has_outdoor = Column(Boolean, default=False)
    good_for_work = Column(Boolean, default=False)
    image_url = Column(String(500))
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    website = Column(String(255), nullable=True)
    contact_number = Column(String(50), nullable=True)

    # New utility metrics
    wifi_speed = Column(String(50), default="Average")  # Fast, Average, Poor, None
    plug_rating = Column(Float, default=0.0)
    vibe_tags = Column(JSON, default=list)  # e.g. ["#DeepWork", "#Aesthetic"]
