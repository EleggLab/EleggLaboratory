from fastapi import Header, HTTPException
from app.core.security import decode_token


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    sub = decode_token(token)
    if not sub:
        raise HTTPException(401, "invalid token")
    return sub
