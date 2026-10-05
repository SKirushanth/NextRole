from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

# Single source of truth: settings (reads env vars, then .env, then the defaults in config.py)
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency to yield DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()