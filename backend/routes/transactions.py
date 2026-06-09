from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_db
from models.schemas import TransactionResponse, StatusOverrideRequest
from services.db_service import DBService

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def read_transactions(
    status: Optional[str] = Query(None, description="Filter by status (Flagged, Cleared, Under Review, Blocked)"),
    risk_min: Optional[int] = Query(None, description="Minimum risk score"),
    risk_max: Optional[int] = Query(None, description="Maximum risk score"),
    search: Optional[str] = Query(None, description="Search by ID, sender ID, receiver ID, or customer name"),
    db: Session = Depends(get_db)
):
    transactions = DBService.get_transactions(db, status=status, risk_min=risk_min, risk_max=risk_max, search=search)
    
    # Map raw DB fields (like comma-separated flags_raw) to List[str] schema attribute
    response_list = []
    for tx in transactions:
        tx_dict = tx.__dict__.copy()
        # Ensure we translate property flags
        tx_dict["flags"] = tx.flags
        response_list.append(TransactionResponse(**tx_dict))
    
    return response_list

@router.post("/{txn_id}/status", response_model=TransactionResponse)
def override_transaction_status(
    txn_id: str,
    payload: StatusOverrideRequest,
    db: Session = Depends(get_db)
):
    valid_statuses = ["Cleared", "Blocked", "Under Review", "Flagged"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    updated_tx = DBService.update_transaction_status(db, txn_id, payload.status)
    if not updated_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    tx_dict = updated_tx.__dict__.copy()
    tx_dict["flags"] = updated_tx.flags
    return TransactionResponse(**tx_dict)
