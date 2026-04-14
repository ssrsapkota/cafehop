from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cafe_id = Column(Integer, ForeignKey("cafes.id"))
    text = Column(Text)
    rating = Column(Float, default=0.0)

    # Utility Metrics Specific to this log
    wifi_speed = Column(String(50), default="")
    plug_rating = Column(Float, default=0.0)
    vibe_tags = Column(JSON, default=list)

    # comma separated list of image urls or filenames
    photos = Column(String(500), default="")
    menu_photo = Column(String(500), default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    cafe = relationship("Cafe")
    likes = relationship("Like", cascade="all, delete-orphan")
    comments = relationship("Comment", cascade="all, delete-orphan")
