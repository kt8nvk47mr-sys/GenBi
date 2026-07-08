import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Use SQLite for local development when Greenplum is not available
GP_AVAILABLE = os.getenv("GP_AVAILABLE", "false").lower() == "true"

if GP_AVAILABLE:
    DATABASE_URL = f"postgresql://{settings.GP_USER}:{settings.GP_PASSWORD}@{settings.GP_HOST}:{settings.GP_PORT}/{settings.GP_DATABASE}"
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args={
            "connect_timeout": 10,
            "options": "-c statement_timeout=30000"
        }
    )
else:
    DATABASE_URL = "sqlite:///./genbi.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def recreate_engine():
    global engine, SessionLocal, DATABASE_URL, GP_AVAILABLE
    from app.core.config import settings
    GP_AVAILABLE = os.getenv("GP_AVAILABLE", "false").lower() == "true"
    if GP_AVAILABLE:
        DATABASE_URL = f"postgresql://{settings.GP_USER}:{settings.GP_PASSWORD}@{settings.GP_HOST}:{settings.GP_PORT}/{settings.GP_DATABASE}"
        engine = create_engine(
            DATABASE_URL,
            pool_size=20,
            max_overflow=10,
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 10,
                "options": "-c statement_timeout=30000"
            }
        )
    else:
        DATABASE_URL = "sqlite:///./genbi.db"
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
