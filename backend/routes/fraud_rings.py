from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from database.connection import get_db
from services.fraud_network import FraudNetworkService

router = APIRouter(prefix="/fraud-rings", tags=["Fraud Rings"])

@router.get("", response_model=Dict[str, Any])
def read_fraud_rings(db: Session = Depends(get_db)):
    """
    Executes structural network analysis (NetworkX) on the transaction base
    to discover rings, clusters, and centralities. Returns a coordinate-mapped 
    graph representation suitable for React Flow.
    """
    return FraudNetworkService.analyze_fraud_network(db)
