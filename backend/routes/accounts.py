from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database.connection import get_db
from models.schemas import AccountResponse
from services.db_service import DBService
from graph.mule_network import MuleNetworkBuilder

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountResponse])
def read_accounts(db: Session = Depends(get_db)):
    accounts = DBService.get_accounts(db)
    return accounts

@router.get("/network", response_model=Dict[str, List[Any]])
def read_mule_network(db: Session = Depends(get_db)):
    # Returns formatted node-edge graph for UI network visualization
    return MuleNetworkBuilder.get_network_topology(db)
