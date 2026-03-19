from fastapi import Header, HTTPException, Depends
from app.core.security import decode_token


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    info = decode_token(token)
    if not info or not info.get("sub"):
        raise HTTPException(401, "invalid token")
    return info


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "admin role required")
    return user
