import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.social import Follow

db: Session = SessionLocal()

follows = db.query(Follow).all()
print("Follows:")
for f in follows:
    print(f"Follower: {f.follower_id}, Following: {f.following_id}")

notifs = db.query(Notification).all()
print("\nNotifs:")
for n in notifs:
    print(
        f"ID: {n.id}, User: {n.user_id}, Actor: {n.actor_id}, Type: {n.type}, Message: {n.message}, Read: {n.is_read}"
    )

db.close()
