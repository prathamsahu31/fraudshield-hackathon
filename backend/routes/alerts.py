from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from models.schemas import AlertResponse
from services.db_service import DBService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def read_alerts(db: Session = Depends(get_db)):
    alerts = DBService.get_alerts(db)
    return alerts
