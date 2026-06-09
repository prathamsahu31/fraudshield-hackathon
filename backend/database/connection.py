import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
logger.info(f"Loaded DATABASE_URL config: {DATABASE_URL}")

# Premium Fallback Mechanism:
# If Postgres is not running or connection URL is missing, fall back to a local SQLite database
# so that the platform remains fully testable and functional.
try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is missing")
    
    # Try connecting to PostgreSQL using SQLAlchemy pg8000
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database.")
except Exception as e:
    logger.warning(f"PostgreSQL connection failed: {e}. Falling back to SQLite database for sandbox testing.")
    sqlite_path = os.path.join(os.path.dirname(__file__), "..", "fraudshield_sandbox.db")
    DATABASE_URL = f"sqlite:///{sqlite_path}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
    )
    logger.info(f"SQLite sandbox engine created at: {sqlite_path}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency Injection helper for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
