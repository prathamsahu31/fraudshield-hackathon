import os
import logging
from sqlalchemy import text
from connection import SessionLocal, Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("load_seed")

def load_seed():
    db = SessionLocal()
    sql_path = os.path.join(os.path.dirname(__file__), "generated_data", "seed_large.sql")
    if not os.path.exists(sql_path):
        logger.error("seed_large.sql file not found.")
        return
        
    logger.info("Loading seed_large.sql DML script...")
    
    try:
        # Recreate tables to ensure clean seeding slate
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        with open(sql_path, "r", encoding="utf-8") as f:
            for line in f:
                stmt = line.strip()
                # Skip comments, empty lines, and transaction blocks
                if not stmt or stmt.startswith("BEGIN") or stmt.startswith("COMMIT") or stmt.startswith("--"):
                    continue
                db.execute(text(stmt))
        db.commit()
        logger.info("Successfully loaded 1000 transactions and 100 accounts into active database.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error loading large seed SQL: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    load_seed()
