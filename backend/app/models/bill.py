from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=True)
    title = Column(String(255), default="Café Bill")
    total_amount = Column(Float, default=0.0)
    payment_mode = Column(String(50), default="cash")  

    
    participants = Column(JSON, default=dict)

    cafe = relationship("Cafe")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
