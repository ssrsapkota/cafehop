
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

EMAIL = "admin@cafehop.com"
PASSWORD = "admin1234"
NAME = "Admin"

db = SessionLocal()

existing = db.query(User).filter(User.email == EMAIL).first()
if existing:
    # Promote the existing user to admin
    existing.role = "admin"
    existing.hashed_password = hash_password(PASSWORD)
    db.commit()
    print(
        f"✅  Existing user '{EMAIL}' promoted to admin. Password reset to: {PASSWORD}"
    )
else:
    user = User(
        name=NAME,
        email=EMAIL,
        hashed_password=hash_password(PASSWORD),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    print(f"✅  Admin user created!")

print(f"\n   Email   : {EMAIL}")
print(f"   Password: {PASSWORD}")
print(f"\n👉 Now go to http://localhost:5173/login and use these credentials.")
db.close()
