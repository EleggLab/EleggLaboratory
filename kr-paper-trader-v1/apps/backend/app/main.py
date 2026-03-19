from fastapi import FastAPI
from app.api.routes import router
from app.core.db import Base, engine
from app import models  # noqa: F401

app = FastAPI(title="KR Paper Trader v1", version="0.2.0")
app.include_router(router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"ok": True, "service": "backend"}
