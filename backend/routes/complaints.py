from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid
import datetime
from database.connection import get_db
from models.db_models import Complaint, Transaction, Account
from models.schemas import ComplaintResponse, ComplaintCreate, ComplaintDetailedResponse, StatusOverrideRequest
from services.db_service import DBService
from services.flow_service import FlowService

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("", response_model=List[ComplaintDetailedResponse])
def read_complaints(db: Session = Depends(get_db)):
    """
    Returns all complaints, automatically including their linked transactions and connected accounts.
    """
    complaints = DBService.get_complaints(db)
    detailed_list = []
    
    for comp in complaints:
        txn = None
        connected_accounts = []
        
        # 1. Retrieve linked transaction if saved
        if comp.transaction_id:
            txn = db.query(Transaction).filter(Transaction.id == comp.transaction_id).first()
            
        # 2. Dynamic auto-link fallback if not linked yet
        if not txn:
            txns = db.query(Transaction).filter(Transaction.sender_id == comp.account_id).all()
            best_match = None
            min_diff = float('inf')
            
            for t in txns:
                diff = abs(float(t.amount) - float(comp.amount))
                # Check within 1% of amount or within $10
                if diff < max(10.0, 0.01 * comp.amount):
                    if diff < min_diff:
                        min_diff = diff
                        best_match = t
                    elif diff == min_diff and t.risk_score > (best_match.risk_score if best_match else 0):
                        best_match = t
                        
            if best_match:
                comp.transaction_id = best_match.id
                db.commit()
                txn = best_match
                
        # 3. Retrieve connected accounts via money flow tracing
        if txn:
            trace = FlowService.trace_money_flow(db, txn.receiver_id, max_depth=2)
            # Find account profiles for each traced node
            for node in trace["nodes"]:
                acc = db.query(Account).filter(Account.id == node["id"]).first()
                if acc:
                    connected_accounts.append(acc)
                    
        detailed_list.append({
            "complaint": comp,
            "linked_transaction": txn,
            "connected_accounts": connected_accounts
        })
        
    return detailed_list

@router.post("", response_model=ComplaintDetailedResponse)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Submits a new customer complaint, auto-links it to the most relevant transaction,
    and returns it along with connected downstream accounts.
    """
    # Verify account exists
    acc = db.query(Account).filter(Account.id == payload.account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    # Generate a unique Complaint ID
    comp_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
    
    # 1. Auto-link to a transaction
    txns = db.query(Transaction).filter(Transaction.sender_id == payload.account_id).all()
    best_match = None
    min_diff = float('inf')
    
    for t in txns:
        diff = abs(float(t.amount) - float(payload.amount))
        if diff < max(10.0, 0.01 * payload.amount):
            if diff < min_diff:
                min_diff = diff
                best_match = t
            elif diff == min_diff and t.risk_score > (best_match.risk_score if best_match else 0):
                best_match = t

    # 2. Save Complaint
    new_comp = Complaint(
        id=comp_id,
        date=datetime.datetime.utcnow(),
        customer_name=payload.customer_name,
        account_id=payload.account_id,
        transaction_id=best_match.id if best_match else None,
        dispute_type=payload.dispute_type,
        amount=payload.amount,
        status="Pending Review",
        details=payload.details
    )
    
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)

    # 3. Find connected accounts
    connected_accounts = []
    if best_match:
        trace = FlowService.trace_money_flow(db, best_match.receiver_id, max_depth=2)
        for node in trace["nodes"]:
            acc_profile = db.query(Account).filter(Account.id == node["id"]).first()
            if acc_profile:
                connected_accounts.append(acc_profile)

    return {
        "complaint": new_comp,
        "linked_transaction": best_match,
        "connected_accounts": connected_accounts
    }

@router.post("/{comp_id}/status", response_model=ComplaintResponse)
def override_complaint_status(
    comp_id: str,
    payload: StatusOverrideRequest,
    db: Session = Depends(get_db)
):
    valid_statuses = ["Pending Review", "Chargeback Initiated", "Resolved - Refunded", "Resolved - Dismissed"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    updated_comp = DBService.update_complaint_status(db, comp_id, payload.status)
    if not updated_comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    return updated_comp
