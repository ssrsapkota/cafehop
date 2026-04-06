from datetime import datetime
from typing import Optional

import re

from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None


class UserCreate(UserBase):
    name: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
