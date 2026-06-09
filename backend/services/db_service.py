from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.db_models import Transaction, Account, Alert, Complaint
from typing import List, Optional

class DBService:
    @staticmethod
    def get_transactions(
        db: Session,
        status: Optional[str] = None,
        risk_min: Optional[int] = None,
        risk_max: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Transaction]:
        query = db.query(Transaction)

        if status and status != "ALL":
            query = query.filter(Transaction.status == status)

        if risk_min is not None:
            query = query.filter(Transaction.risk_score >= risk_min)

        if risk_max is not None:
            query = query.filter(Transaction.risk_score <= risk_max)

        if search:
            search_pattern = f"%{search}%"
            query = query.join(Account, Transaction.sender_id == Account.id).filter(
                or_(
                    Transaction.id.ilike(search_pattern),
                    Transaction.sender_id.ilike(search_pattern),
                    Transaction.receiver_id.ilike(search_pattern),
                    Account.label.ilike(search_pattern)
                )
            )

        return query.order_by(Transaction.timestamp.desc()).all()

    @staticmethod
    def update_transaction_status(db: Session, txn_id: str, new_status: str) -> Optional[Transaction]:
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if txn:
            txn.status = new_status
            db.commit()
            db.refresh(txn)
        return txn

    @staticmethod
    def get_accounts(db: Session) -> List[Account]:
        return db.query(Account).all()

    @staticmethod
    def get_alerts(db: Session) -> List[Alert]:
        return db.query(Alert).order_by(Alert.timestamp.desc()).all()

    @staticmethod
    def get_complaints(db: Session) -> List[Complaint]:
        return db.query(Complaint).order_by(Complaint.date.desc()).all()

    @staticmethod
    def update_complaint_status(db: Session, comp_id: str, new_status: str) -> Optional[Complaint]:
        comp = db.query(Complaint).filter(Complaint.id == comp_id).first()
        if comp:
            comp.status = new_status
            db.commit()
            db.refresh(comp)
        return comp
