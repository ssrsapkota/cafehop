from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin_user
from app.schemas.cafe_schema import CafeCreate, CafeOut
from app.services import cafe_service

router = APIRouter(prefix="/cafes", tags=["cafes"])


@router.get("/", response_model=List[CafeOut])
def get_cafes(
    skip: int = 0,
    limit: int = 500,
    search: Optional[str] = None,
    city: Optional[str] = None,
    lat_min: Optional[float] = None,
    lat_max: Optional[float] = None,
    lng_min: Optional[float] = None,
    lng_max: Optional[float] = None,
    db: Session = Depends(get_db),
):
    return cafe_service.get_cafes(db, skip, limit, search, city, lat_min, lat_max, lng_min, lng_max)


@router.get("/count")
def get_cafe_count(db: Session = Depends(get_db)):
    return {"count": cafe_service.get_cafe_count(db)}


@router.post("/bulk-import", status_code=status.HTTP_201_CREATED)
def bulk_import_cafes(
    cafes: List[CafeCreate],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user),
):
    """Bulk-import a list of cafes (admin only). Skips duplicates by name+city."""
    return cafe_service.bulk_import_cafes(db, cafes)


@router.get("/fetch-from-osm")
async def fetch_cafes_from_osm(
    city: str = Query(..., description="City name to search cafes in"),
    limit: int = Query(30, le=100),
    current_user: dict = Depends(get_current_admin_user),
):
    """
    Fetch café data from OpenStreetMap Overpass API (no API key required).
    Returns a list of cafes that can then be imported.
    """
    return await cafe_service.fetch_cafes_from_osm(city, limit)


@router.post("/", response_model=CafeOut, status_code=status.HTTP_201_CREATED)
def create_cafe(
    cafe: CafeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user),
):
    return cafe_service.create_cafe(db, cafe)


@router.get("/{cafe_id}", response_model=CafeOut)
def get_cafe(cafe_id: int, db: Session = Depends(get_db)):
    cafe = cafe_service.get_cafe(db, cafe_id)
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    return cafe


@router.put("/{cafe_id}", response_model=CafeOut)
def update_cafe(
    cafe_id: int,
    cafe_in: CafeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user),
):
    cafe = cafe_service.update_cafe(db, cafe_id, cafe_in)
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    return cafe


@router.delete("/{cafe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cafe(
    cafe_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user),
):
    success = cafe_service.delete_cafe(db, cafe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cafe not found")
    return None
