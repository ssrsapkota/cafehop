from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt

from .config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt directly."""
    # Truncate to 72 bytes to stay within bcrypt's limit
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    password_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire_minutes = expires_minutes or settings.access_token_expire_minutes
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return subject
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
