import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.core.database import engine

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE cafes ADD COLUMN lat FLOAT NULL;"))
        print("Added lat column")
    except Exception as e:
        print("lat column error:", e)

    try:
        conn.execute(text("ALTER TABLE cafes ADD COLUMN lng FLOAT NULL;"))
        print("Added lng column")
    except Exception as e:
        print("lng column error:", e)

print("Running seeder...")
from seed_cafes import seed_cafes

seed_cafes()
