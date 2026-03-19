from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

POSTGRES_USER = os.getenv("POSTGRES_USER", "papertrader")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "papertrader")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "papertrader")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./papertrader.db")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
