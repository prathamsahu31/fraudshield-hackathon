import datetime
import logging
from database.connection import SessionLocal, Base, engine
from models.db_models import Account, Transaction, Alert, Complaint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def seed_database():
    logger.info("Starting database seeding...")
    db = SessionLocal()

    # Recreate tables to ensure clean slate in sandbox
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Mock Accounts data
    mock_accounts = [
        Account(id="ACT-4491-09", label="Sarah Jenkins", bank="FraudShield AI Bank", risk_score=88, balance=14500.0, type="Standard", x=100, y=200),
        Account(id="ACT-8812-76", label="Mule Account A (Hub)", bank="Offshore Finance", risk_score=96, balance=84000.0, type="Mule Hub", x=300, y=200),
        Account(id="ACT-0099-23", label="Mule Account B (Smurf)", bank="Apex Digital Bank", risk_score=82, balance=12000.0, type="Smurf", x=500, y=100),
        Account(id="ACT-6632-19", label="Mule Account C (Smurf)", bank="Vanguard Retail", risk_score=78, balance=15000.0, type="Smurf", x=500, y=300),
        Account(id="BTC-Wallet-3px90a1", label="Crypto Exchange (Exit Node)", bank="Sovereign Crypto Bank", risk_score=99, balance=350000.0, type="Integrator", x=750, y=200),
        Account(id="ACT-1090-33", label="Secondary Deposit", bank="FraudShield AI Bank", risk_score=45, balance=3200.0, type="Standard", x=100, y=100),
        Account(id="ACT-2244-90", label="External Shell Co.", bank="Caribbean Cayman Bank", risk_score=94, balance=120000.0, type="Integrator", x=750, y=350),
        # Extra account records
        Account(id="ACT-3021-99", label="Robert Chen", bank="FraudShield AI Bank", risk_score=74, balance=5800.0, type="Standard", x=120, y=280),
        Account(id="ACT-7712-45", label="Maria Gonzalez", bank="FraudShield AI Bank", risk_score=8, balance=1250.0, type="Standard", x=150, y=320),
        Account(id="ACT-1102-88", label="James Davidson", bank="FraudShield AI Bank", risk_score=95, balance=28000.0, type="Standard", x=90, y=350),
        Account(id="ACT-9021-34", label="Amanda Ross", bank="FraudShield AI Bank", risk_score=12, balance=950.0, type="Standard", x=200, y=50),
    ]

    for acc in mock_accounts:
        db.add(acc)
    db.commit()
    logger.info(f"Seeded {len(mock_accounts)} accounts.")

    # 2. Mock Transactions data
    mock_transactions = [
        Transaction(
            id="TXN-9021",
            timestamp=datetime.datetime(2026, 6, 6, 2, 45, 12),
            sender_id="ACT-4491-09",
            receiver_id="ACT-8812-76",
            receiver_bank="Zenith Global Trust",
            amount=14500.00,
            type="Wire",
            risk_score=88,
            status="Flagged",
            flags_raw="Geographic Velocity Mismatch,High Transaction Volume",
            geo_ip="185.220.101.4",
            location="Frankfurt, DE (via VPN)",
            device="Mozilla/5.0 (Linux; Android 11)"
        ),
        Transaction(
            id="TXN-9022",
            timestamp=datetime.datetime(2026, 6, 6, 2, 30, 45),
            sender_id="ACT-3021-99",
            receiver_id="BTC-Wallet-3px90a1",
            receiver_bank="Sovereign Crypto Bank",
            amount=4890.00,
            type="P2P",
            risk_score=74,
            status="Under Review",
            flags_raw="Rapid Funds Turnover,Crypto-Related Beneficiary",
            geo_ip="92.119.177.30",
            location="Reykjavik, IS",
            device="Brave/Windows 10"
        ),
        Transaction(
            id="TXN-9023",
            timestamp=datetime.datetime(2026, 6, 6, 2, 12, 0),
            sender_id="ACT-7712-45",
            receiver_id="ACT-1090-33",
            receiver_bank="Metro Credit Union",
            amount=124.50,
            type="Card",
            risk_score=8,
            status="Cleared",
            flags_raw="",
            geo_ip="73.14.99.112",
            location="Austin, TX, US",
            device="Apple Pay (iPhone 15)"
        ),
        Transaction(
            id="TXN-9024",
            timestamp=datetime.datetime(2026, 6, 6, 1, 58, 30),
            sender_id="ACT-1102-88",
            receiver_id="ACT-2244-90",
            receiver_bank="First Offshore Corp",
            amount=25000.00,
            type="Wire",
            risk_score=95,
            status="Blocked",
            flags_raw="Sanctioned Jurisdiction Route,New Beneficiary Account",
            geo_ip="46.19.141.12",
            location="Nicosia, CY",
            device="Safari/macOS 14"
        ),
        Transaction(
            id="TXN-9025",
            timestamp=datetime.datetime(2026, 6, 6, 1, 40, 15),
            sender_id="ACT-9021-34",
            receiver_id="ACT-4491-09",
            receiver_bank="FraudShield AI Bank",
            amount=600.00,
            type="Internal",
            risk_score=12,
            status="Cleared",
            flags_raw="Trusted Peer Network",
            geo_ip="68.80.201.55",
            location="Philadelphia, PA, US",
            device="Chrome/macOS"
        ),
    ]

    for txn in mock_transactions:
        db.add(txn)
    db.commit()
    logger.info(f"Seeded {len(mock_transactions)} transactions.")

    # 3. Mock Alerts data
    mock_alerts = [
        Alert(id="GEO-001", timestamp=datetime.datetime(2026, 6, 6, 2, 45, 12), ip_address="185.220.101.4", country="Germany", risk_score=88, velocity_mismatch=True, device_signature="Android 11 Mobile", action_taken="Challenged"),
        Alert(id="GEO-002", timestamp=datetime.datetime(2026, 6, 6, 1, 58, 30), ip_address="46.19.141.12", country="Cyprus", risk_score=95, velocity_mismatch=True, device_signature="Safari Mac 14", action_taken="Blocked"),
        Alert(id="GEO-003", timestamp=datetime.datetime(2026, 6, 6, 2, 30, 45), ip_address="92.119.177.30", country="Iceland", risk_score=74, velocity_mismatch=False, device_signature="Brave Browser Win 10", action_taken="Allowed"),
        Alert(id="GEO-004", timestamp=datetime.datetime(2026, 6, 6, 3, 1, 0), ip_address="82.102.23.109", country="Russia", risk_score=99, velocity_mismatch=True, device_signature="Tor Exit Node", action_taken="Blocked"),
    ]

    for alert in mock_alerts:
        db.add(alert)
    db.commit()
    logger.info(f"Seeded {len(mock_alerts)} IP velocity alerts.")

    # 4. Mock Complaints data
    mock_complaints = [
        Complaint(id="CMP-701", date=datetime.datetime(2026, 6, 6, 1, 22), customer_name="Sarah Jenkins", account_id="ACT-4491-09", dispute_type="Unauthorized Wire", amount=14500.0, status="Pending Review", details="Customer reports receiving an SMS link requesting security code validation, after which a wire transfer for $14,500 was dispatched without consent."),
        Complaint(id="CMP-702", date=datetime.datetime(2026, 6, 5, 18, 40), customer_name="Jonathan Davis", account_id="ACT-1102-88", dispute_type="Card Skimming", amount=450.0, status="Chargeback Initiated", details="Physical ATM card cloned and used for cash out in Las Vegas while customer maintains physical custody of the card in Chicago."),
        Complaint(id="CMP-703", date=datetime.datetime(2026, 6, 4, 11, 30), customer_name="Aria Patel", account_id="ACT-9021-34", dispute_type="Phishing Transfer", amount=2800.0, status="Resolved - Refunded", details="Fake banking portal login led to compromised credentials. Recovered via insurance waiver."),
    ]

    for comp in mock_complaints:
        db.add(comp)
    db.commit()
    logger.info(f"Seeded {len(mock_complaints)} disputes/complaints.")

    db.close()
    logger.info("Database seeding complete!")

if __name__ == "__main__":
    seed_database()
