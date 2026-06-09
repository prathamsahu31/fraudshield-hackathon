-- FraudShield AI PostgreSQL Database Schema
-- Generated: 2026-06-06

-- Drop tables if they exist to allow clean reconstruction
DROP TABLE IF EXISTS investigation_timeline CASCADE;
DROP TABLE IF EXISTS investigation_notes CASCADE;
DROP TABLE IF EXISTS investigation_transactions CASCADE;
DROP TABLE IF EXISTS investigations CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- 1. Accounts Table
CREATE TABLE accounts (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    bank VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    type VARCHAR(50) NOT NULL DEFAULT 'Standard', -- Mule Hub, Smurf, Integrator, Standard
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactions Table
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sender_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    receiver_id VARCHAR(50) NOT NULL,
    receiver_bank VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(50) NOT NULL, -- Wire, ACH, P2P, Card, Internal
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'Cleared', -- Flagged, Cleared, Under Review, Blocked
    flags_raw TEXT DEFAULT '', -- Comma-separated list of risk flags
    geo_ip VARCHAR(50),
    location VARCHAR(150),
    device VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Alerts Table
CREATE TABLE alerts (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    velocity_mismatch BOOLEAN NOT NULL DEFAULT FALSE,
    device_signature VARCHAR(150),
    action_taken VARCHAR(50) NOT NULL DEFAULT 'Allowed', -- Blocked, Challenged, Allowed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Complaints Table
CREATE TABLE complaints (
    id VARCHAR(50) PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_name VARCHAR(100) NOT NULL,
    account_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    dispute_type VARCHAR(100) NOT NULL, -- Unauthorized Wire, Card Skimming, Phishing Transfer, Identity Theft, ACH Dispute
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review', -- Pending Review, Chargeback Initiated, Resolved - Refunded, Resolved - Dismissed
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Investigations Table
CREATE TABLE investigations (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'Medium', -- Critical, High, Medium, Low
    status VARCHAR(50) NOT NULL DEFAULT 'Reported', -- Reported, Under Review, Escalated, Closed
    assignee VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Investigation-Transaction Mapping Table (Many-to-Many relationship)
CREATE TABLE investigation_transactions (
    case_id VARCHAR(50) REFERENCES investigations(id) ON DELETE CASCADE,
    transaction_id VARCHAR(50) REFERENCES transactions(id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, transaction_id)
);

-- 7. Investigation Notes Table
CREATE TABLE investigation_notes (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    author VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Investigation Timeline / Audit Log Table
CREATE TABLE investigation_timeline (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    user_identity VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index optimization for fraud scoring queries
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_risk_score ON transactions(risk_score);
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_complaints_account_id ON complaints(account_id);
CREATE INDEX idx_investigations_status ON investigations(status);
