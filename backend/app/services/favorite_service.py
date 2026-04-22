from sqlalchemy.orm import Session

from app.models.cafe import Cafe
from app.models.favorite import Favorite
from app.schemas.favorite_schema import FavoriteBase


def list_favorites(db: Session, user_id: int):
    return db.query(Favorite).filter(Favorite.user_id == user_id).all()


def add_favorite(db: Session, user_id: int, fav: FavoriteBase):
    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id, Favorite.cafe_id == fav.cafe_id)
        .first()
    )
    if existing:
        return existing

    cafe = db.query(Cafe).filter(Cafe.id == fav.cafe_id).first()
    if not cafe:
        return None

    new_fav = Favorite(user_id=user_id, cafe_id=fav.cafe_id)
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    return new_fav


def remove_favorite(db: Session, user_id: int, cafe_id: int):
    fav = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id, Favorite.cafe_id == cafe_id)
        .first()
    )
    if fav:
        db.delete(fav)
        db.commit()
    return True
