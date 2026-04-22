from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.cafe import Cafe
from app.models.cafe_list import CafeList, CafeListItem
from app.models.user import User
from app.schemas.list_schema import (
    CafeListCreate,
    CafeListItemBase,
    CafeListItemOut,
    CafeListOut,
)

router = APIRouter(prefix="/lists", tags=["lists"])


@router.get("/me", response_model=list[CafeListOut])
def my_lists(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get customized lists for current user"""
    lists = db.query(CafeList).filter(CafeList.user_id == current_user.id).all()
    # Also create a default "Favorites" list if none exists
    if not lists:
        fav_list = CafeList(user_id=current_user.id, name="Favorites", is_public=False)
        db.add(fav_list)
        db.commit()
        db.refresh(fav_list)
        lists = [fav_list]
    return lists


@router.get("/user/{user_id}", response_model=list[CafeListOut])
def user_lists(user_id: int, db: Session = Depends(get_db)):
    """Get customized lists for specific user"""
    lists = db.query(CafeList).filter(CafeList.user_id == user_id).all()
    return lists


@router.post("/", response_model=CafeListOut)
def create_list(
    list_in: CafeListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new custom list"""
    new_list = CafeList(
        user_id=current_user.id, name=list_in.name, is_public=list_in.is_public
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list


@router.post("/{list_id}/items", response_model=CafeListItemOut)
def add_to_list(
    list_id: int,
    item_in: CafeListItemBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a cafe to a custom list"""
    cafe_list = (
        db.query(CafeList)
        .filter(CafeList.id == list_id, CafeList.user_id == current_user.id)
        .first()
    )
    if not cafe_list:
        raise HTTPException(status_code=404, detail="List not found")

    cafe = db.query(Cafe).filter(Cafe.id == item_in.cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")

    # check if already in list
    existing = (
        db.query(CafeListItem)
        .filter(
            CafeListItem.list_id == list_id, CafeListItem.cafe_id == item_in.cafe_id
        )
        .first()
    )
    if existing:
        return existing

    new_item = CafeListItem(list_id=list_id, cafe_id=item_in.cafe_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.delete("/{list_id}/items/{cafe_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_list(
    list_id: int,
    cafe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a cafe from a list"""
    cafe_list = (
        db.query(CafeList)
        .filter(CafeList.id == list_id, CafeList.user_id == current_user.id)
        .first()
    )
    if not cafe_list:
        raise HTTPException(status_code=404, detail="List not found")

    item = (
        db.query(CafeListItem)
        .filter(CafeListItem.list_id == list_id, CafeListItem.cafe_id == cafe_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return None
