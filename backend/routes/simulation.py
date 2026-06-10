from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
import datetime
from database.connection import get_db
from models.db_models import Account, Transaction, Complaint, Investigation, InvestigationTransaction, InvestigationTimeline, InvestigationNote

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/run", response_model=Dict[str, Any])
def run_simulation(db: Session = Depends(get_db)):
    """
    Seeds a realistic multi-hop banking fraud scenario in the database.
    Deletes any previously run simulation data first to ensure clean state and repeatability.
    """
    try:
        # 1. Clean up old simulation records
        db.query(InvestigationTimeline).filter(InvestigationTimeline.case_id == "CASE-SIM-01").delete()
        db.query(InvestigationNote).filter(InvestigationNote.case_id == "CASE-SIM-01").delete()
        db.query(InvestigationTransaction).filter(InvestigationTransaction.case_id == "CASE-SIM-01").delete()
        db.query(Investigation).filter(Investigation.id == "CASE-SIM-01").delete()
        db.query(Complaint).filter(Complaint.id == "CMP-SIM-01").delete()
        db.query(Transaction).filter(Transaction.id.in_(["TXN-SIM-01", "TXN-SIM-02"])).delete(synchronize_session=False)
        db.query(Account).filter(Account.id.in_(["ACT-SAFE-99", "ACT-SMURF-99", "ACT-HUB-99"])).delete(synchronize_session=False)
        db.commit()
        
        # 2. Seed Accounts
        victim = Account(
            id="ACT-SAFE-99",
            label="Alice Cooper",
            bank="FraudShield AI Bank",
            balance=25000.00,
            risk_score=15,
            type="Standard",
            x=150,
            y=350
        )
        smurf = Account(
            id="ACT-SMURF-99",
            label="Mule Ring 99 Smurf 1",
            bank="Zenith Global Trust",
            balance=0.00,
            risk_score=15, # initially normal
            type="Standard", # initially standard
            x=350,
            y=200
        )
        hub = Account(
            id="ACT-HUB-99",
            label="Mule Ring 99 Hub Account",
            bank="Offshore Finance",
            balance=0.00,
            risk_score=20,
            type="Standard",
            x=550,
            y=350
        )
        db.add(victim)
        db.add(smurf)
        db.add(hub)
        db.commit()

        # 3. Seed Complaint
        complaint = Complaint(
            id="CMP-SIM-01",
            date=datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=10),
            customer_name="Alice Cooper",
            account_id="ACT-SAFE-99",
            transaction_id="TXN-SIM-01", # Will link to transaction below
            dispute_type="Unauthorized Wire",
            amount=12450.00,
            status="Pending Review",
            details="Customer Alice Cooper reports receiving an SMS phishing warning regarding login verification. Subsequently, an unauthorized wire transfer of $12,450.00 was dispatched from her savings account."
        )
        db.add(complaint)

        # 4. Seed Transactions
        # Txn 1: Victim to Smurf
        txn1 = Transaction(
            id="TXN-SIM-01",
            timestamp=datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=8),
            sender_id="ACT-SAFE-99",
            receiver_id="ACT-SMURF-99",
            receiver_bank="Zenith Global Trust",
            amount=12450.00,
            type="Wire",
            risk_score=94, # Triggered AI risk score
            status="Flagged",
            flags_raw="Impossible Velocity,Emulated Device",
            geo_ip="185.220.101.4",
            location="Frankfurt, DE (via Tor)",
            device="Mozilla/5.0 (Linux; Android 11)"
        )
        # Txn 2: Layering hop from Smurf to Hub
        txn2 = Transaction(
            id="TXN-SIM-02",
            timestamp=datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=5),
            sender_id="ACT-SMURF-99",
            receiver_id="ACT-HUB-99",
            receiver_bank="Offshore Finance",
            amount=12000.00,
            type="Wire",
            risk_score=85,
            status="Cleared",
            flags_raw="Structuring Threshold Mismatch,Layering Phase",
            geo_ip="92.119.177.30",
            location="Reykjavik, IS",
            device="Safari/macOS 14"
        )
        db.add(txn1)
        db.add(txn2)
        db.commit()

        # 5. Promoted/Flagged accounts
        smurf.risk_score = 85
        smurf.type = "Smurf"
        hub.risk_score = 95
        hub.type = "Mule Hub"
        db.commit()

        # 6. Create Case
        case = Investigation(
            id="CASE-SIM-01",
            title="Structured Transfer Ring: Alice Cooper Compromise",
            description="Automatic investigation triggered by phishing wire transfer (TXN-SIM-01) from Alice Cooper ($12,450.00) subsequently layered to Offshore Finance hub.",
            severity="Critical",
            status="Under Review",
            assignee="Marcus Brody",
            created_at=datetime.datetime.now(datetime.UTC),
            updated_at=datetime.datetime.now(datetime.UTC)
        )
        db.add(case)
        db.commit()

        # Link transactions to case
        db.add(InvestigationTransaction(case_id="CASE-SIM-01", transaction_id="TXN-SIM-01"))
        db.add(InvestigationTransaction(case_id="CASE-SIM-01", transaction_id="TXN-SIM-02"))

        # Seed timeline entries
        timeline1 = InvestigationTimeline(
            case_id="CASE-SIM-01",
            action="Case Opened",
            user_identity="System-Compliance",
            details="Critical phishing ring alerts triggered. Automatic audit case initialized.",
            created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(seconds=60)
        )
        timeline2 = InvestigationTimeline(
            case_id="CASE-SIM-01",
            action="Transaction Linked",
            user_identity="System-Compliance",
            details="Linked fraudulent wire TXN-SIM-01 ($12,450.00) and layering transfer TXN-SIM-02 ($12,000.00).",
            created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(seconds=45)
        )
        db.add(timeline1)
        db.add(timeline2)
        db.commit()

        return {
            "status": "success",
            "victim_account": "ACT-SAFE-99",
            "case_id": "CASE-SIM-01",
            "events": [
                {
                    "time": 0,
                    "event": "complaint_arrives",
                    "title": "Fraud Complaint Filed",
                    "details": "Customer Alice Cooper reports unauthorized access. Claim ID: CMP-SIM-01.",
                    "data": { "id": "CMP-SIM-01", "customer_name": "Alice Cooper", "amount": 12450.0 }
                },
                {
                    "time": 10,
                    "event": "transaction_appears",
                    "title": "Wire Transaction Dispatched",
                    "details": "Outbound Wire of $12,450.00 to Zenith Global Trust (ACT-SMURF-99) detected.",
                    "data": { "id": "TXN-SIM-01", "sender_id": "ACT-SAFE-99", "receiver_id": "ACT-SMURF-99", "amount": 12450.0 }
                },
                {
                    "time": 20,
                    "event": "ai_prediction_triggered",
                    "title": "AI Risk Engine Classification",
                    "details": "Fraud probability: 94.0%. Anomalies: Impossible Velocity, Emulated Device. Status set to FLAGGED.",
                    "data": { "txn_id": "TXN-SIM-01", "risk_score": 94, "status": "Flagged" }
                },
                {
                    "time": 30,
                    "event": "mule_network_expands",
                    "title": "Downstream Transfer Detected",
                    "details": "Layering transaction of $12,000.00 from ACT-SMURF-99 to ACT-HUB-99 identified.",
                    "data": { "id": "TXN-SIM-02", "sender_id": "ACT-SMURF-99", "receiver_id": "ACT-HUB-99", "amount": 12000.0 }
                },
                {
                    "time": 40,
                    "event": "accounts_flagged",
                    "title": "Nodes Designation Promoted",
                    "details": "Accounts ACT-SMURF-99 promoted to SMURF (Risk 85), ACT-HUB-99 promoted to MULE HUB (Risk 95).",
                    "data": { "accounts": ["ACT-SMURF-99", "ACT-HUB-99"] }
                },
                {
                    "time": 50,
                    "event": "case_created",
                    "title": "Investigation Case Initialized",
                    "details": "Critical Investigation CASE-SIM-01 created. Assignee: Marcus Brody. Connected accounts isolated.",
                    "data": { "case_id": "CASE-SIM-01", "severity": "Critical", "title": "Structured Transfer Ring: Alice Cooper Compromise" }
                }
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Simulation trigger failed: {e}")

