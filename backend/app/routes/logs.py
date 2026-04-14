import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.cafe import Cafe
from app.models.log import Log
from app.models.notification import Notification
from app.models.social import Follow
from app.models.user import User
from app.schemas.log_schema import LogCreate, LogOut

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/upload", response_model=dict)
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return its URL path"""
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("static", "uploads", filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    return {"url": f"/static/uploads/{filename}"}


@router.get("/", response_model=list[LogOut])
def list_logs(db: Session = Depends(get_db)):
    """List all logs/activities"""
    return db.query(Log).order_by(Log.created_at.desc()).all()


@router.get("/me", response_model=list[LogOut])
def my_logs(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """List current user's logs"""
    return (
        db.query(Log)
        .filter(Log.user_id == current_user.id)
        .order_by(Log.created_at.desc())
        .all()
    )


@router.get("/user/{user_id}", response_model=list[LogOut])
def user_logs(user_id: int, db: Session = Depends(get_db)):
    """List specific user's logs"""
    return (
        db.query(Log)
        .filter(Log.user_id == user_id)
        .order_by(Log.created_at.desc())
        .all()
    )


def update_cafe_rating(db: Session, cafe_id: int):
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if cafe:
        all_logs = db.query(Log).filter(Log.cafe_id == cafe.id, Log.rating > 0).all()
        if all_logs:
            avg_rating = sum(l.rating for l in all_logs) / len(all_logs)
            cafe.rating = round(avg_rating, 1)

            all_plug_ratings = [
                l.plug_rating for l in all_logs if getattr(l, "plug_rating", 0) > 0
            ]
            if all_plug_ratings:
                avg_plug = sum(all_plug_ratings) / len(all_plug_ratings)
                cafe.plug_rating = round(avg_plug, 1)
        else:
            cafe.rating = 0.0
            cafe.plug_rating = 0.0
        db.commit()


@router.post("/", response_model=LogOut, status_code=status.HTTP_201_CREATED)
def create_log(
    log_in: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new log/visit"""
    # Override user_id just in case
    log_data = log_in.model_dump()
    log_data["user_id"] = current_user.id

    new_log = Log(**log_data)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    update_cafe_rating(db, new_log.cafe_id)

    # Find cafe
    cafe = db.query(Cafe).filter(Cafe.id == new_log.cafe_id).first()
    cafe_name = cafe.name if cafe else "a cafe"

    # Notify followers
    followers = (
        db.query(Follow.follower_id)
        .filter(Follow.following_id == current_user.id)
        .all()
    )
    for (follower_id,) in followers:
        n = Notification(
            user_id=follower_id,
            actor_id=current_user.id,
            type="new_log",
            message=f"posted a new review for {cafe_name}.",
        )
        db.add(n)
    db.commit()

    return new_log


@router.put("/{log_id}", response_model=LogOut)
def update_log(
    log_id: int,
    log_in: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing log (owner only)"""
    log = db.query(Log).filter(Log.id == log_id, Log.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found or insufficient permissions")

    log.text = log_in.text
    log.rating = log_in.rating
    log.vibe_tags = log_in.vibe_tags
    log.wifi_speed = log_in.wifi_speed
    log.plug_rating = log_in.plug_rating
    db.commit()
    db.refresh(log)

    update_cafe_rating(db, log.cafe_id)
    return log



@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a log (Admins can delete any log)"""
    if current_user.role == "admin":
        log = db.query(Log).filter(Log.id == log_id).first()
    else:
        log = db.query(Log).filter(Log.id == log_id, Log.user_id == current_user.id).first()
        
    if not log:
        raise HTTPException(status_code=404, detail="Log not found or insufficient permissions")

    cafe_id = log.cafe_id
    db.delete(log)
    db.commit()

    update_cafe_rating(db, cafe_id)

    return None
