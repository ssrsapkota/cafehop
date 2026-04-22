from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.favorite_schema import FavoriteBase, FavoriteOut
from app.services import favorite_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/me", response_model=list[FavoriteOut])
def list_favorites(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """List user's favorite cafes"""
    return favorite_service.list_favorites(db, current_user.id)


@router.post("/me", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
def add_favorite(
    fav: FavoriteBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a favorite cafe"""
    new_fav = favorite_service.add_favorite(db, current_user.id, fav)
    if not new_fav:
        raise HTTPException(status_code=404, detail="Cafe not found")
    return new_fav


@router.delete("/me/{cafe_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    cafe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a favorite cafe"""
    favorite_service.remove_favorite(db, current_user.id, cafe_id)
    return None
