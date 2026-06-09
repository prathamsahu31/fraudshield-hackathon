import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.connection import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)
    label = Column(String, nullable=False)
    bank = Column(String, nullable=False)
    balance = Column(Float, default=0.0)
    risk_score = Column(Integer, default=0)
    type = Column(String, default="Standard")  # Mule Hub, Smurf, Integrator, Standard
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)

    # Relationships
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_id", back_populates="sender")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    sender_id = Column(String, ForeignKey("accounts.id"), nullable=False)
    receiver_id = Column(String, nullable=False)
    receiver_bank = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # Wire, ACH, P2P, Card, Internal
    risk_score = Column(Integer, default=0)
    status = Column(String, default="Cleared")  # Flagged, Cleared, Under Review, Blocked
    flags_raw = Column(String, default="")  # Comma-separated list of risk flags (e.g. "Geographic velocity mismatch,New device login")
    geo_ip = Column(String, nullable=True)
    location = Column(String, nullable=True)
    device = Column(String, nullable=True)

    # Relationships
    sender = relationship("Account", foreign_keys=[sender_id], back_populates="sent_transactions")

    @property
    def flags(self):
        if not self.flags_raw:
            return []
        return [f.strip() for f in self.flags_raw.split(",") if f.strip()]

    @flags.setter
    def flags(self, val_list):
        self.flags_raw = ",".join(val_list)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String, nullable=False)
    country = Column(String, nullable=False)
    risk_score = Column(Integer, default=0)
    velocity_mismatch = Column(Boolean, default=False)
    device_signature = Column(String, nullable=True)
    action_taken = Column(String, default="Allowed")  # Blocked, Challenged, Allowed

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    customer_name = Column(String, nullable=False)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    dispute_type = Column(String, nullable=False)  # Unauthorized Wire, Card Skimming, Phishing Transfer, Identity Theft, ACH Dispute
    amount = Column(Float, nullable=False)
    status = Column(String, default="Pending Review")  # Pending Review, Chargeback Initiated, Resolved - Refunded, Resolved - Dismissed
    details = Column(Text, nullable=True)

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="Medium")  # Critical, High, Medium, Low
    status = Column(String, default="Reported")  # Reported, Under Review, Escalated, Closed
    assignee = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class InvestigationTransaction(Base):
    __tablename__ = "investigation_transactions"

    case_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), primary_key=True)
    transaction_id = Column(String, ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True)

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    author = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InvestigationTimeline(Base):
    __tablename__ = "investigation_timeline"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    user_identity = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
