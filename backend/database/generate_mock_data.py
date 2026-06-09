import csv
import os
import random
import datetime

# Create output folder
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Configurations
NUM_ACCOUNTS = 100
NUM_TRANSACTIONS = 1000
NUM_RINGS = 10
NUM_COMPLAINTS = 20

# Mock lists for generation
BANKS = ["FraudShield AI Bank", "Zenith Global Trust", "Apex Digital Bank", "Metro Credit Union", "Sovereign Crypto Bank", "First Offshore Corp", "Caribbean Cayman Bank", "Vanguard Retail", "NeoBank Tech", "Offshore Finance"]
FIRST_NAMES = ["John", "Sarah", "Robert", "Maria", "James", "Amanda", "David", "Linda", "Alex", "Emily", "Michael", "Patricia", "William", "Elizabeth", "Charles", "Jennifer", "Joseph", "Maria", "Daniel", "Susan"]
LAST_NAMES = ["Smith", "Jenkins", "Chen", "Gonzalez", "Davidson", "Ross", "Kim", "Henderson", "Mercer", "Miller", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Garcia", "Martinez", "Robinson"]
COMPLAINT_TYPES = ["Unauthorized Wire", "Card Skimming", "Phishing Transfer", "Identity Theft", "ACH Dispute"]
DEVICE_TYPES = ["Chrome/macOS", "Brave/Windows 10", "Safari/iOS 17", "Mozilla/5.0 (Linux; Android 11)", "Safari/macOS 14", "Chrome/Android 13", "Firefox/Linux"]
COUNTRIES = ["United States", "Germany", "Cyprus", "Russia", "Iceland", "United Kingdom", "Canada", "Singapore", "Switzerland", "Cayman Islands"]

def generate_dataset():
    print("Generating realistic banking fraud data...")
    
    # 1. Create 100 Accounts
    # 10 Fraud Rings * 4 accounts each (1 Hub, 2 Smurfs, 1 Exit) = 40 ring accounts (all suspicious)
    # 10 Suspicious standard accounts = 10 suspicious
    # 50 Safe standard accounts = 50 safe
    # Total = 100 accounts (50 suspicious, 50 safe)
    
    accounts = []
    suspicious_ids = set()
    ring_members = {} # ring_id -> {hubs, smurfs, exits}
    
    # Generate Fraud Rings
    idx = 1
    for r in range(1, NUM_RINGS + 1):
        ring_members[r] = {"hub": "", "smurfs": [], "exit": ""}
        
        # Hub Account
        hub_id = f"ACT-HUB-{r:02d}"
        ring_members[r]["hub"] = hub_id
        suspicious_ids.add(hub_id)
        accounts.append({
            "id": hub_id,
            "label": f"Mule Ring {r} Hub Account",
            "bank": random.choice(BANKS),
            "balance": round(random.uniform(50000.0, 200000.0), 2),
            "risk_score": random.randint(85, 98),
            "type": "Mule Hub",
            "x": 300,
            "y": 50 + (r * 40)
        })
        
        # 2 Smurfs
        for s in range(1, 3):
            smurf_id = f"ACT-SMURF-{r:02d}-{s}"
            ring_members[r]["smurfs"].append(smurf_id)
            suspicious_ids.add(smurf_id)
            accounts.append({
                "id": smurf_id,
                "label": f"Mule Ring {r} Smurf {s}",
                "bank": random.choice(BANKS),
                "balance": round(random.uniform(5000.0, 25000.0), 2),
                "risk_score": random.randint(60, 84),
                "type": "Smurf",
                "x": 100 + (s * 80),
                "y": 30 + (r * 40)
            })
            
        # Exit Node
        exit_id = f"ACT-EXIT-{r:02d}"
        ring_members[r]["exit"] = exit_id
        suspicious_ids.add(exit_id)
        accounts.append({
            "id": exit_id,
            "label": f"Mule Ring {r} Exit Integration",
            "bank": "Sovereign Crypto Bank" if r % 2 == 0 else "Caribbean Cayman Bank",
            "balance": round(random.uniform(100000.0, 500000.0), 2),
            "risk_score": random.randint(94, 100),
            "type": "Integrator",
            "x": 600,
            "y": 50 + (r * 40)
        })
    
    # Generate 10 Suspicious standard accounts
    for s_idx in range(1, 11):
        s_id = f"ACT-SUSP-{s_idx:02d}"
        suspicious_ids.add(s_id)
        accounts.append({
            "id": s_id,
            "label": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "bank": random.choice(BANKS),
            "balance": round(random.uniform(2000.0, 80000.0), 2),
            "risk_score": random.randint(30, 49),
            "type": "Standard",
            "x": random.randint(80, 200),
            "y": random.randint(50, 450)
        })
        
    # Generate 50 Safe standard accounts
    for g_idx in range(1, 51):
        g_id = f"ACT-SAFE-{g_idx:02d}"
        accounts.append({
            "id": g_id,
            "label": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "bank": random.choice(BANKS),
            "balance": round(random.uniform(1000.0, 50000.0), 2),
            "risk_score": random.randint(0, 24),
            "type": "Standard",
            "x": random.randint(80, 200),
            "y": random.randint(50, 450)
        })
        
    # 2. Generate 1000 Transactions
    # 800 Safe transactions
    # 200 Fraud ring/layering transactions
    transactions = []
    start_date = datetime.datetime(2026, 5, 1, 0, 0, 0)
    
    # Generate 800 Safe transactions
    safe_account_ids = [a["id"] for a in accounts if a["id"] not in suspicious_ids]
    for t_idx in range(1, 801):
        sender = random.choice(safe_account_ids)
        receiver = random.choice(safe_account_ids)
        while receiver == sender:
            receiver = random.choice(safe_account_ids)
            
        timestamp = start_date + datetime.timedelta(
            days=random.randint(0, 35),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        
        amount = round(random.uniform(10.0, 1500.0), 2)
        transactions.append({
            "id": f"TXN-SAFE-{t_idx:04d}",
            "timestamp": timestamp,
            "sender_id": sender,
            "receiver_id": receiver,
            "receiver_bank": random.choice(BANKS),
            "amount": amount,
            "type": random.choice(["Card", "ACH", "P2P"]),
            "risk_score": random.randint(0, 20),
            "status": "Cleared",
            "flags_raw": "",
            "geo_ip": f"{random.randint(24, 200)}.{random.randint(10, 100)}.{random.randint(10, 100)}.{random.randint(1, 254)}",
            "location": f"{random.choice(['New York', 'Chicago', 'Austin', 'Seattle'])}, US",
            "device": random.choice(DEVICE_TYPES)
        })
        
    # Generate 200 Fraud Ring Transactions (Structuring + Layering + Exiting)
    # Hops: Victim -> Smurf -> Hub -> Exit
    for f_idx in range(1, 201):
        ring_num = random.randint(1, NUM_RINGS)
        ring = ring_members[ring_num]
        
        timestamp = start_date + datetime.timedelta(
            days=random.randint(0, 35),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        
        # Decide transaction flow stage
        flow_stage = random.choice(["SMURF_TO_HUB", "HUB_TO_EXIT", "VICTIM_TO_SMURF"])
        
        if flow_stage == "VICTIM_TO_SMURF":
            sender = random.choice(safe_account_ids)
            receiver = random.choice(ring["smurfs"])
            amount = round(random.uniform(1000.0, 4500.0), 2)
            risk = random.randint(45, 75)
            status = "Cleared" if risk < 50 else "Under Review"
            flags = "Unusual High Value deposit"
            loc = f"{random.choice(COUNTRIES)} (via Proxy)"
        elif flow_stage == "SMURF_TO_HUB":
            sender = random.choice(ring["smurfs"])
            receiver = ring["hub"]
            amount = round(random.uniform(2500.0, 4999.0), 2)  # structured just below reporting limit
            risk = random.randint(70, 89)
            status = "Flagged"
            flags = "Structuring Threshold Mismatch,Layering Phase"
            loc = f"{random.choice(COUNTRIES)} (via VPN)"
        else: # HUB_TO_EXIT
            sender = ring["hub"]
            receiver = ring["exit"]
            amount = round(random.uniform(15000.0, 45000.0), 2)  # aggregated payout
            risk = random.randint(90, 100)
            status = "Blocked" if random.random() > 0.5 else "Flagged"
            flags = "Large Integration Outflow,High Risk Crypto Route"
            loc = f"{random.choice(COUNTRIES)} (via VPN)"
            
        transactions.append({
            "id": f"TXN-FRAUD-{f_idx:04d}",
            "timestamp": timestamp,
            "sender_id": sender,
            "receiver_id": receiver,
            "receiver_bank": "Sovereign Crypto Bank" if receiver == ring["exit"] else random.choice(BANKS),
            "amount": amount,
            "type": "Wire" if flow_stage != "VICTIM_TO_SMURF" else "ACH",
            "risk_score": risk,
            "status": status,
            "flags_raw": flags,
            "geo_ip": f"{random.randint(24, 200)}.{random.randint(10, 100)}.{random.randint(10, 100)}.{random.randint(1, 254)}",
            "location": loc,
            "device": random.choice(DEVICE_TYPES)
        })

    # Sort transactions by timestamp so they load chronologically
    transactions.sort(key=lambda x: x["timestamp"])

    # 3. Generate 50 Alerts (IP velocity/impossible travel logs on suspicious accounts)
    alerts = []
    suspicious_list = list(suspicious_ids)
    for a_idx in range(1, 51):
        timestamp = start_date + datetime.timedelta(
            days=random.randint(0, 35),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        
        alerts.append({
            "id": f"GEO-LARGE-{a_idx:03d}",
            "timestamp": timestamp,
            "ip_address": f"{random.randint(24, 200)}.{random.randint(10, 100)}.{random.randint(10, 100)}.{random.randint(1, 254)}",
            "country": random.choice(COUNTRIES),
            "risk_score": random.randint(50, 100),
            "velocity_mismatch": random.choice([True, False]),
            "device_signature": random.choice(DEVICE_TYPES),
            "action_taken": random.choice(["Blocked", "Challenged", "Allowed"])
        })
        
    # 4. Generate 20 complaints (victims complaining of unauthorized wire to smurf/hubs)
    complaints = []
    fraud_txns = [t for t in transactions if "FRAUD" in t["id"] and t["sender_id"] in safe_account_ids]
    for c_idx in range(1, NUM_COMPLAINTS + 1):
        # Find corresponding txn
        linked_tx = fraud_txns[c_idx % len(fraud_txns)]
        victim = next(a for a in accounts if a["id"] == linked_tx["sender_id"])
        
        complaints.append({
            "id": f"CMP-LARGE-{c_idx:03d}",
            "date": linked_tx["timestamp"] + datetime.timedelta(hours=random.randint(2, 48)),
            "customer_name": victim["label"],
            "account_id": victim["id"],
            "dispute_type": random.choice(COMPLAINT_TYPES),
            "amount": linked_tx["amount"],
            "status": "Pending Review",
            "details": f"Customer reports unauthorized {linked_tx['type']} transfer for ${linked_tx['amount']} sent to unrecognized recipient account. Potential credential theft."
        })

    # Write to CSV files
    write_csv("accounts.csv", accounts)
    write_csv("transactions.csv", transactions)
    write_csv("alerts.csv", alerts)
    write_csv("complaints.csv", complaints)
    
    # Generate SQL file
    generate_sql_file(accounts, transactions, alerts, complaints)
    print("Realistic datasets generated successfully inside the database/generated_data folder.")

def write_csv(filename, data):
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not data:
        return
    keys = data[0].keys()
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for row in data:
            row_copy = row.copy()
            # Format datetime objects nicely
            for k, v in row_copy.items():
                if isinstance(v, datetime.datetime):
                    row_copy[k] = v.strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow(row_copy)
    print(f"Wrote CSV file: {filepath}")

def generate_sql_file(accounts, transactions, alerts, complaints):
    sql_path = os.path.join(OUTPUT_DIR, "seed_large.sql")
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- LARGE SEED DATA SETS FOR FRAUDSHIELD AI (POSTGRESQL)\n")
        f.write("-- GENERATED AUTOMATICALLY BY PYTHON GENERATOR SCRIPT\n\n")
        
        f.write("BEGIN;\n\n")
        
        # 1. Seed Accounts
        f.write("-- Seeding Accounts (100 total)\n")
        for acc in accounts:
            f.write(f"INSERT INTO accounts (id, label, bank, balance, risk_score, type, x, y) VALUES ('{acc['id']}', '{acc['label']}', '{acc['bank']}', {acc['balance']}, {acc['risk_score']}, '{acc['type']}', {acc['x']}, {acc['y']});\n")
        
        f.write("\n-- Seeding Transactions (1000 total)\n")
        for tx in transactions:
            ts = tx['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
            flags = tx['flags_raw'].replace("'", "''")
            f.write(f"INSERT INTO transactions (id, timestamp, sender_id, receiver_id, receiver_bank, amount, type, risk_score, status, flags_raw, geo_ip, location, device) VALUES ('{tx['id']}', '{ts}+00', '{tx['sender_id']}', '{tx['receiver_id']}', '{tx['receiver_bank']}', {tx['amount']}, '{tx['type']}', {tx['risk_score']}, '{tx['status']}', '{flags}', '{tx['geo_ip']}', '{tx['location']}', '{tx['device']}');\n")
            
        f.write("\n-- Seeding Alerts (50 total)\n")
        for al in alerts:
            ts = al['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"INSERT INTO alerts (id, timestamp, ip_address, country, risk_score, velocity_mismatch, device_signature, action_taken) VALUES ('{al['id']}', '{ts}+00', '{al['ip_address']}', '{al['country']}', {al['risk_score']}, {str(al['velocity_mismatch']).upper()}, '{al['device_signature']}', '{al['action_taken']}');\n")
            
        f.write("\n-- Seeding Complaints (20 total)\n")
        for cp in complaints:
            ts = cp['date'].strftime("%Y-%m-%d %H:%M:%S")
            details = cp['details'].replace("'", "''")
            f.write(f"INSERT INTO complaints (id, date, customer_name, account_id, dispute_type, amount, status, details) VALUES ('{cp['id']}', '{ts}+00', '{cp['customer_name']}', '{cp['account_id']}', '{cp['dispute_type']}', {cp['amount']}, '{cp['status']}', '{details}');\n")
            
        f.write("\nCOMMIT;\n")
    print(f"Wrote SQL seed script: {sql_path}")

if __name__ == "__main__":
    generate_dataset()
