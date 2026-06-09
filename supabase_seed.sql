-- Supabase PostgreSQL Initialization & Seed Data for FraudShield AI
-- Copy and paste this entirely into the Supabase SQL Editor and click "Run"

-- ==========================================
-- 1. SCHEMA DEFINITION (CREATE TABLES)
-- ==========================================

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR PRIMARY KEY,
    label VARCHAR NOT NULL,
    bank VARCHAR NOT NULL,
    balance FLOAT DEFAULT 0.0,
    risk_score INTEGER DEFAULT 0,
    type VARCHAR DEFAULT 'Standard',
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sender_id VARCHAR NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    receiver_id VARCHAR NOT NULL,
    receiver_bank VARCHAR NOT NULL,
    amount FLOAT NOT NULL,
    type VARCHAR NOT NULL,
    risk_score INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'Cleared',
    flags_raw VARCHAR DEFAULT '',
    geo_ip VARCHAR,
    location VARCHAR,
    device VARCHAR
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR NOT NULL,
    country VARCHAR NOT NULL,
    risk_score INTEGER DEFAULT 0,
    velocity_mismatch BOOLEAN DEFAULT FALSE,
    device_signature VARCHAR,
    action_taken VARCHAR DEFAULT 'Allowed'
);

CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_name VARCHAR NOT NULL,
    account_id VARCHAR NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_id VARCHAR REFERENCES transactions(id) ON DELETE SET NULL,
    dispute_type VARCHAR NOT NULL,
    amount FLOAT NOT NULL,
    status VARCHAR DEFAULT 'Pending Review',
    details TEXT
);

CREATE TABLE IF NOT EXISTS investigations (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR DEFAULT 'Medium',
    status VARCHAR DEFAULT 'Reported',
    assignee VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investigation_transactions (
    case_id VARCHAR REFERENCES investigations(id) ON DELETE CASCADE,
    transaction_id VARCHAR REFERENCES transactions(id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, transaction_id)
);

CREATE TABLE IF NOT EXISTS investigation_notes (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    author VARCHAR NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investigation_timeline (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    action VARCHAR NOT NULL,
    user_identity VARCHAR NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 2. SEED DATA (INSERT MOCK RECORDS)
-- ==========================================

-- Insert Accounts
INSERT INTO accounts (id, label, bank, balance, risk_score, type, x, y) VALUES
('ACT-SAFE-12', 'Corporate Payroll', 'Chase', 1250000.00, 5, 'Standard', 150, 100),
('ACT-MULE-88', 'Shell Corp A', 'BoA', 450.50, 92, 'Mule Hub', 450, 150),
('ACT-MULE-89', 'Shell Corp B', 'Wells Fargo', 120.00, 88, 'Smurf', 600, 120),
('ACT-INT-99', 'Crypto Exchange X', 'Binance', 500000.00, 95, 'Integrator', 750, 200),
('ACT-SAFE-45', 'John Doe Personal', 'Citi', 5400.00, 2, 'Standard', 100, 300),
('ACT-VICTIM-01', 'Jane Smith Savings', 'Chase', 850.00, 85, 'Standard', 300, 350)
ON CONFLICT (id) DO NOTHING;

-- Insert Transactions
INSERT INTO transactions (id, timestamp, sender_id, receiver_id, receiver_bank, amount, type, risk_score, status, flags_raw, geo_ip, location, device) VALUES
('TXN-98234-A', '2026-06-09 08:15:00', 'ACT-SAFE-12', 'ACT-SAFE-45', 'Citi', 2500.00, 'ACH', 5, 'Cleared', '', '192.168.1.1', 'New York, US', 'MacBook Pro'),
('TXN-88211-M', '2026-06-09 09:30:00', 'ACT-VICTIM-01', 'ACT-MULE-88', 'BoA', 9500.00, 'Wire', 88, 'Flagged', 'New device login,Velocity mismatch', '14.12.33.5', 'Moscow, RU', 'Unknown Android'),
('TXN-88212-M', '2026-06-09 09:35:00', 'ACT-MULE-88', 'ACT-MULE-89', 'Wells Fargo', 4500.00, 'P2P', 92, 'Flagged', 'Rapid forwarding,Known mule network', '14.12.33.6', 'Moscow, RU', 'Unknown Android'),
('TXN-88213-M', '2026-06-09 09:40:00', 'ACT-MULE-89', 'ACT-INT-99', 'Binance', 4450.00, 'Wire', 95, 'Blocked', 'Crypto exit node,High risk beneficiary', '45.22.11.9', 'Cyprus, CY', 'Server Script'),
('TXN-11223-C', '2026-06-09 10:00:00', 'ACT-SAFE-45', 'ACT-MERCH-01', 'Stripe', 45.00, 'Card', 2, 'Cleared', '', '68.11.22.33', 'Chicago, US', 'iPhone 14')
ON CONFLICT (id) DO NOTHING;

-- Insert Alerts
INSERT INTO alerts (id, timestamp, ip_address, country, risk_score, velocity_mismatch, device_signature, action_taken) VALUES
('ALT-2026-01', '2026-06-09 09:30:05', '14.12.33.5', 'RU', 95, TRUE, 'hash-android-xyz', 'Challenged'),
('ALT-2026-02', '2026-06-09 09:40:02', '45.22.11.9', 'CY', 98, TRUE, 'hash-server-abc', 'Blocked'),
('ALT-2026-03', '2026-06-09 02:15:00', '185.11.22.33', 'KP', 99, FALSE, 'hash-vpn-123', 'Blocked')
ON CONFLICT (id) DO NOTHING;

-- Insert Complaints
INSERT INTO complaints (id, date, customer_name, account_id, transaction_id, dispute_type, amount, status, details) VALUES
('CMP-99881', '2026-06-09 10:15:00', 'Jane Smith', 'ACT-VICTIM-01', 'TXN-88211-M', 'Unauthorized Wire', 9500.00, 'Pending Review', 'Customer states they never authorized the $9500 wire transfer. Their phone was stolen yesterday.'),
('CMP-99882', '2026-06-08 14:20:00', 'Michael Johnson', 'ACT-SAFE-45', NULL, 'Card Skimming', 125.50, 'Resolved - Refunded', 'Unauthorized charges appeared at a gas station in another state.')
ON CONFLICT (id) DO NOTHING;

-- Insert Investigations
INSERT INTO investigations (id, title, description, severity, status, assignee, created_at, updated_at) VALUES
('CASE-2026-01', 'Eastern Europe Mule Ring (Jane Smith)', 'Coordinated account takeover targeting retail savings accounts and funneling to crypto exchanges via BoA mules.', 'Critical', 'Under Review', 'Agent_007', '2026-06-09 10:30:00', '2026-06-09 10:35:00'),
('CASE-2026-02', 'Suspicious Payroll Activity', 'Multiple small transactions originating from corporate payroll account at 3am.', 'Medium', 'Reported', 'Unassigned', '2026-06-08 09:00:00', '2026-06-08 09:00:00')
ON CONFLICT (id) DO NOTHING;

-- Insert Investigation Transactions (Mapping Table)
INSERT INTO investigation_transactions (case_id, transaction_id) VALUES
('CASE-2026-01', 'TXN-88211-M'),
('CASE-2026-01', 'TXN-88212-M'),
('CASE-2026-01', 'TXN-88213-M')
ON CONFLICT (case_id, transaction_id) DO NOTHING;

-- Insert Investigation Notes
INSERT INTO investigation_notes (case_id, author, text, created_at) VALUES
('CASE-2026-01', 'Agent_007', 'Customer confirmed phone was stolen. IP address originates from known VPN block.', '2026-06-09 10:32:00'),
('CASE-2026-01', 'System', 'Auto-escalated due to critical velocity threshold.', '2026-06-09 10:35:00');
