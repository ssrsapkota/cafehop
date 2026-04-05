import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine  # add this line
from app.routes import (
    auth,
    bills,
    cafes,
    favorites,
    lists,
    logs,
    notifications,
    social,
    users,
)

app = FastAPI()

from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# create all tables in the "cafe" database if they don't exist
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(cafes.router, prefix="/api")
app.include_router(bills.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(social.router, prefix="/api")
app.include_router(lists.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Welcome to the CafeHop "}
