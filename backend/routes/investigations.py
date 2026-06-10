from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import datetime
import uuid
from database.connection import get_db
from models.db_models import Investigation, InvestigationTransaction, InvestigationNote, InvestigationTimeline, Transaction, Account
from models.schemas import (
    InvestigationBase, InvestigationCreate, InvestigationNoteBase, 
    InvestigationNoteCreate, InvestigationTimelineBase, InvestigationDetailResponse
)
from pydantic import BaseModel

class FreezeAccountRequest(BaseModel):
    account_id: str

router = APIRouter(prefix="/investigations", tags=["Investigations"])

@router.get("", response_model=List[InvestigationBase])
def read_investigations(db: Session = Depends(get_db)):
    """
    Returns all active and closed investigation cases.
    """
    return db.query(Investigation).order_by(Investigation.updated_at.desc()).all()

@router.post("", response_model=InvestigationBase)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db)):
    """
    Submits a new investigation case.
    """
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    new_case = Investigation(
        id=case_id,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        status="Reported",
        assignee=payload.assignee,
        created_at=datetime.datetime.now(datetime.UTC),
        updated_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(new_case)
    
    # Create initial timeline entry
    timeline_entry = InvestigationTimeline(
        case_id=case_id,
        action="Case Opened",
        user_identity=payload.assignee,
        details=f"Case opened manually by investigator with severity {payload.severity}.",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(timeline_entry)
    
    db.commit()
    db.refresh(new_case)
    return new_case

@router.get("/{case_id}", response_model=InvestigationDetailResponse)
def read_investigation_details(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full details for a case: metadata, timeline, notes, linked transactions, and connected accounts.
    """
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Fetch notes and timeline
    notes = db.query(InvestigationNote).filter(InvestigationNote.case_id == case_id).order_by(InvestigationNote.created_at.desc()).all()
    timeline = db.query(InvestigationTimeline).filter(InvestigationTimeline.case_id == case_id).order_by(InvestigationTimeline.created_at.asc()).all()

    # Fetch linked transactions mapping
    mappings = db.query(InvestigationTransaction).filter(InvestigationTransaction.case_id == case_id).all()
    txn_ids = [m.transaction_id for m in mappings]
    
    transactions = db.query(Transaction).filter(Transaction.id.in_(txn_ids)).all() if txn_ids else []

    # Map connected accounts from these transactions
    account_ids = set()
    for t in transactions:
        account_ids.add(t.sender_id)
        account_ids.add(t.receiver_id)

    accounts = db.query(Account).filter(Account.id.in_(list(account_ids))).all() if account_ids else []

    # Map flags correctly for Transaction schemas
    mapped_txns = []
    for tx in transactions:
        tx_dict = tx.__dict__.copy()
        tx_dict.pop("_sa_instance_state", None)
        tx_dict["flags"] = tx.flags
        mapped_txns.append(tx_dict)

    return {
        "case": case,
        "timeline": timeline,
        "notes": notes,
        "linked_transactions": mapped_txns,
        "linked_accounts": accounts
    }

@router.post("/{case_id}/notes", response_model=InvestigationNoteBase)
def add_investigation_note(case_id: str, payload: InvestigationNoteCreate, db: Session = Depends(get_db)):
    """
    Adds a new narrative note to the case and registers it on the timeline.
    """
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    new_note = InvestigationNote(
        case_id=case_id,
        author=payload.author,
        text=payload.text,
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(new_note)

    timeline = InvestigationTimeline(
        case_id=case_id,
        action="Note Added",
        user_identity=payload.author,
        details=f"Added case note: \"{payload.text[:50]}...\"",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(timeline)
    
    case.updated_at = datetime.datetime.now(datetime.UTC)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.post("/{case_id}/freeze")
def freeze_case_accounts(case_id: str, payload: FreezeAccountRequest, db: Session = Depends(get_db)):
    """
    Freezes a specific linked account. Set its risk score to 100 and logs the action on the timeline.
    """
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    account_id = payload.account_id
    if not account_id:
        raise HTTPException(status_code=400, detail="Missing account_id parameter")

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Update account type and risk score
    account.risk_score = 100
    account.type = "Mule Hub"  # Visually mark it as a mule node
    
    # Also block transactions involving this account
    db.query(Transaction).filter(
        (Transaction.sender_id == account_id) | (Transaction.receiver_id == account_id)
    ).update({"status": "Blocked"}, synchronize_session=False)

    timeline = InvestigationTimeline(
        case_id=case_id,
        action="Account Frozen",
        user_identity="Agent-Compliance",
        details=f"Asset freeze order executed on account {account_id} ({account.label}). All pending transfers blocked.",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(timeline)
    
    case.updated_at = datetime.datetime.now(datetime.UTC)
    db.commit()
    
    return {"status": "success", "message": f"Account {account_id} has been frozen successfully."}

@router.post("/{case_id}/escalate", response_model=InvestigationBase)
def escalate_case(case_id: str, db: Session = Depends(get_db)):
    """
    Escalates the case status to 'Escalated' and increases severity to 'Critical'.
    """
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "Escalated"
    case.severity = "Critical"
    case.updated_at = datetime.datetime.now(datetime.UTC)

    timeline = InvestigationTimeline(
        case_id=case_id,
        action="Case Escalated",
        user_identity="Agent-In-Charge",
        details="Case status escalated to Escalated. Severity boosted to Critical. Sent alert notifications to AML Legal Desks.",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(timeline)
    db.commit()
    db.refresh(case)
    return case

@router.post("/{case_id}/close", response_model=InvestigationBase)
def close_case(case_id: str, db: Session = Depends(get_db)):
    """
    Closes the investigation case.
    """
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "Closed"
    case.updated_at = datetime.datetime.now(datetime.UTC)

    timeline = InvestigationTimeline(
        case_id=case_id,
        action="Case Closed",
        user_identity="Agent-In-Charge",
        details="Investigation resolved. SAR filed with regulatory authorities. Case marked as Closed.",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(timeline)
    db.commit()
    db.refresh(case)
    return case

