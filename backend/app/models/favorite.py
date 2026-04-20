from sqlalchemy import Column, ForeignKey, Integer

from app.core.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    cafe_id = Column(Integer, ForeignKey("cafes.id", ondelete="CASCADE"))
