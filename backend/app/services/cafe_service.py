from typing import List, Optional

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cafe import Cafe
from app.schemas.cafe_schema import CafeCreate


def get_cafes(
    db: Session,
    skip: int = 0,
    limit: int = 500,
    search: Optional[str] = None,
    city: Optional[str] = None,
    lat_min: Optional[float] = None,
    lat_max: Optional[float] = None,
    lng_min: Optional[float] = None,
    lng_max: Optional[float] = None,
):
    q = db.query(Cafe)
    if search:
        q = q.filter(Cafe.name.ilike(f"%{search}%"))
    if city:
        q = q.filter(Cafe.city.ilike(f"%{city}%"))
    # Bounding-box filter (for "Search this area" map feature)
    if lat_min is not None:
        q = q.filter(Cafe.lat >= lat_min)
    if lat_max is not None:
        q = q.filter(Cafe.lat <= lat_max)
    if lng_min is not None:
        q = q.filter(Cafe.lng >= lng_min)
    if lng_max is not None:
        q = q.filter(Cafe.lng <= lng_max)
    return q.offset(skip).limit(limit).all()


def get_cafe_count(db: Session):
    return db.query(Cafe).count()


def bulk_import_cafes(db: Session, cafes: List[CafeCreate]):
    created = 0
    skipped = 0
    for cafe_data in cafes:
        exists = (
            db.query(Cafe)
            .filter(Cafe.name == cafe_data.name, Cafe.city == cafe_data.city)
            .first()
        )
        if exists:
            skipped += 1
            continue
        db_cafe = Cafe(**cafe_data.dict())
        db.add(db_cafe)
        created += 1
    db.commit()
    return {"created": created, "skipped": skipped}


async def fetch_cafes_from_osm(city: str, limit: int):
    overpass_query = f"""
    [out:json][timeout:25];
    area[name="{city}"][place~"city|town"]->.searchArea;
    nwr["amenity"="cafe"](area.searchArea);
    out center {limit};
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_query},
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Overpass API error: {str(e)}")

    results = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name", "").strip()
        if not name:
            continue

        lat = element.get("lat") or element.get("center", {}).get("lat")
        lng = element.get("lon") or element.get("center", {}).get("lon")

        results.append(
            {
                "name": name,
                "city": city,
                "area": tags.get("addr:suburb") or tags.get("addr:district") or "",
                "address": " ".join(
                    filter(
                        None,
                        [
                            tags.get("addr:housenumber", ""),
                            tags.get("addr:street", ""),
                        ],
                    )
                ),
                "description": tags.get("description") or tags.get("note") or "",
                "has_wifi": tags.get("internet_access") in ("wlan", "yes"),
                "has_outdoor": tags.get("outdoor_seating") == "yes",
                "good_for_work": False,
                "rating": 0.0,
                "price_level": None,
                "image_url": None,
                "lat": lat,
                "lng": lng,
                "wifi_speed": "Average",
                "plug_rating": 0.0,
                "vibe_tags": [],
            }
        )

    return {"city": city, "count": len(results), "cafes": results}


def create_cafe(db: Session, cafe: CafeCreate):
    db_cafe = Cafe(**cafe.dict())
    db.add(db_cafe)
    db.commit()
    db.refresh(db_cafe)
    return db_cafe


def get_cafe(db: Session, cafe_id: int):
    return db.query(Cafe).filter(Cafe.id == cafe_id).first()


def update_cafe(db: Session, cafe_id: int, cafe_in: CafeCreate):
    cafe = get_cafe(db, cafe_id)
    if not cafe:
        return None
    for key, value in cafe_in.dict(exclude_unset=True).items():
        setattr(cafe, key, value)
    db.commit()
    db.refresh(cafe)
    return cafe


from app.models.log import Log
from app.models.cafe_list import CafeListItem
from app.models.bill import Bill
from app.models.favorite import Favorite
from app.models.social import Like, Comment

def delete_cafe(db: Session, cafe_id: int):
    cafe = get_cafe(db, cafe_id)
    if not cafe:
        return False
    
    logs = db.query(Log).filter(Log.cafe_id == cafe_id).all()
    log_ids = [log.id for log in logs]
    
    if log_ids:
        db.query(Like).filter(Like.log_id.in_(log_ids)).delete(synchronize_session=False)
        db.query(Comment).filter(Comment.log_id.in_(log_ids)).delete(synchronize_session=False)
        db.query(Log).filter(Log.id.in_(log_ids)).delete(synchronize_session=False)
        
    db.query(CafeListItem).filter(CafeListItem.cafe_id == cafe_id).delete(synchronize_session=False)
    db.query(Bill).filter(Bill.cafe_id == cafe_id).delete(synchronize_session=False)
    db.query(Favorite).filter(Favorite.cafe_id == cafe_id).delete(synchronize_session=False)
    
    db.delete(cafe)
    db.commit()
    return True
