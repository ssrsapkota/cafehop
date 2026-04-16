from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.log import Log
from app.models.notification import Notification
from app.models.social import Comment, Follow, Like
from app.models.user import User
from app.schemas.log_schema import LogOut
from app.schemas.social_schema import (
    CommentCreate,
    CommentOut,
    FollowCreate,
    FollowOut,
    LikeCreate,
    LikeOut,
)

router = APIRouter(prefix="/social", tags=["social"])


@router.post("/follow", response_model=FollowOut)
def follow_user(
    follow_in: FollowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == follow_in.following_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target_user = db.query(User).filter(User.id == follow_in.following_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_follow = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == follow_in.following_id,
        )
        .first()
    )
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")

    new_follow = Follow(
        follower_id=current_user.id, following_id=follow_in.following_id
    )
    db.add(new_follow)

    # Create a notification for the person being followed
    n = Notification(
        user_id=follow_in.following_id,
        actor_id=current_user.id,
        type="follow",
        message="started following you.",
    )
    db.add(n)

    db.commit()
    db.refresh(new_follow)
    return new_follow


@router.delete("/follow/{following_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    following_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_follow = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id, Follow.following_id == following_id
        )
        .first()
    )
    if not existing_follow:
        raise HTTPException(status_code=404, detail="Follow relationship not found")

    db.delete(existing_follow)
    db.commit()
    return None


@router.post("/like", response_model=LikeOut)
def like_log(
    like_in: LikeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(Log).filter(Log.id == like_in.log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    existing_like = (
        db.query(Like)
        .filter(Like.user_id == current_user.id, Like.log_id == like_in.log_id)
        .first()
    )
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked this log")

    new_like = Like(user_id=current_user.id, log_id=like_in.log_id)
    db.add(new_like)

    # Notify the log author if not liking their own log
    if log.user_id != current_user.id:
        n = Notification(
            user_id=log.user_id,
            actor_id=current_user.id,
            type="like",
            message="liked your review.",
        )
        db.add(n)

    db.commit()
    db.refresh(new_like)
    return new_like


@router.delete("/like/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlike_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_like = (
        db.query(Like)
        .filter(Like.user_id == current_user.id, Like.log_id == log_id)
        .first()
    )
    if not existing_like:
        raise HTTPException(status_code=404, detail="Like not found")

    db.delete(existing_like)
    db.commit()
    return None


@router.post("/comment", response_model=CommentOut)
def comment_log(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(Log).filter(Log.id == comment_in.log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    new_comment = Comment(
        user_id=current_user.id, log_id=comment_in.log_id, text=comment_in.text
    )
    db.add(new_comment)

    # Notify the log author if not commenting on their own log
    if log.user_id != current_user.id:
        n = Notification(
            user_id=log.user_id,
            actor_id=current_user.id,
            type="comment",
            message=f"commented: '{comment_in.text[:20]}...'"
            if len(comment_in.text) > 20
            else f"commented: '{comment_in.text}'",
        )
        db.add(n)

    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.delete("/comment/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.user_id == current_user.id)
        .first()
    )
    if not existing_comment:
        raise HTTPException(
            status_code=404, detail="Comment not found or you don't have permission"
        )

    db.delete(existing_comment)
    db.commit()
    return None


@router.get("/feed", response_model=List[LogOut])
def get_feed(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    following_ids = (
        db.query(Follow.following_id)
        .filter(Follow.follower_id == current_user.id)
        .subquery()
    )
    logs = (
        db.query(Log)
        .filter((Log.user_id.in_(following_ids)) | (Log.user_id == current_user.id))
        .order_by(Log.created_at.desc())
        .all()
    )
    return logs


@router.get("/log/{log_id}/comments", response_model=List[CommentOut])
def get_log_comments(log_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Comment)
        .filter(Comment.log_id == log_id)
        .order_by(Comment.created_at.desc())
        .all()
    )


@router.get("/log/{log_id}/likes", response_model=List[LikeOut])
def get_log_likes(log_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Like)
        .filter(Like.log_id == log_id)
        .order_by(Like.created_at.desc())
        .all()
    )


@router.get("/user/{user_id}/followers")
def get_user_followers(user_id: int, db: Session = Depends(get_db)):
    followers = (
        db.query(Follow.follower_id).filter(Follow.following_id == user_id).all()
    )
    return [f[0] for f in followers]


@router.get("/user/{user_id}/following")
def get_user_following(user_id: int, db: Session = Depends(get_db)):
    following = (
        db.query(Follow.following_id).filter(Follow.follower_id == user_id).all()
    )
    return [f[0] for f in following]
