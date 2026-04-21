from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CafeList(Base):
    __tablename__ = "cafe_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationship
    items = relationship(
        "CafeListItem", back_populates="cafe_list", cascade="all, delete-orphan"
    )


class CafeListItem(Base):
    __tablename__ = "cafe_list_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("cafe_lists.id", ondelete="CASCADE"))
    cafe_id = Column(Integer, ForeignKey("cafes.id"))
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    cafe_list = relationship("CafeList", back_populates="items")
    cafe = relationship("Cafe")
