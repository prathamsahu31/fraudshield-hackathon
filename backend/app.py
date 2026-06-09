from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv

# Load environment configs
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# Lazy database schema creation on import
from database.connection import Base, engine
import models.db_models
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas compiled successfully.")
    
    # Run manual migration to add transaction_id to complaints if missing
    from sqlalchemy import text
    from database.connection import SessionLocal
    db_session = SessionLocal()
    try:
        if engine.name == "sqlite":
            res = db_session.execute(text("PRAGMA table_info(complaints)")).fetchall()
            cols = [r[1] for r in res]
            if "transaction_id" not in cols:
                db_session.execute(text("ALTER TABLE complaints ADD COLUMN transaction_id VARCHAR(50)"))
                db_session.commit()
                logger.info("Added transaction_id column to complaints table (SQLite).")
        else:
            db_session.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(50)"))
            db_session.commit()
            logger.info("Added transaction_id column to complaints table (PostgreSQL).")
    except Exception as em:
        logger.error(f"Error running manual migration: {em}")
    finally:
        db_session.close()
except Exception as e:
    logger.error(f"Error compiling schemas: {e}")

# Import router modules
from routes import transactions, alerts, complaints, accounts, predict, fraud_rings, money_flow, investigations, simulation

app = FastAPI(
    title="FraudShield AI API Engine",
    description="Enterprise Banking Fraud Intelligence Platform API backend engine.",
    version="1.0.0"
)

# Load CORS origins
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
origins = [org.strip() for org in allowed_origins_raw.split(",") if org.strip()]
logger.info(f"Setting up CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "FraudShield AI API Engine",
        "version": "1.0.0",
        "database_driver": engine.name
    }

# Include routers
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(complaints.router)
app.include_router(accounts.router)
app.include_router(predict.router)
app.include_router(fraud_rings.router)
app.include_router(money_flow.router)
app.include_router(investigations.router)
app.include_router(simulation.router)
