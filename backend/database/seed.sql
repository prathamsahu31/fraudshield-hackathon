-- Seed initial mock datasets for FraudShield AI PostgreSQL
-- Date: 2026-06-06

-- 1. Insert Accounts
INSERT INTO accounts (id, label, bank, balance, risk_score, type, x, y) VALUES
('ACT-4491-09', 'Sarah Jenkins', 'FraudShield AI Bank', 14500.00, 88, 'Standard', 100, 200),
('ACT-8812-76', 'Mule Account A (Hub)', 'Offshore Finance', 84000.00, 96, 'Mule Hub', 300, 200),
('ACT-0099-23', 'Mule Account B (Smurf)', 'Apex Digital Bank', 12000.00, 82, 'Smurf', 500, 100),
('ACT-6632-19', 'Mule Account C (Smurf)', 'Vanguard Retail', 15000.00, 78, 'Smurf', 500, 300),
('BTC-Wallet-3px90a1', 'Crypto Exchange (Exit Node)', 'Sovereign Crypto Bank', 350000.00, 99, 'Integrator', 750, 200),
('ACT-1090-33', 'Secondary Deposit', 'FraudShield AI Bank', 3200.00, 45, 'Standard', 100, 100),
('ACT-2244-90', 'External Shell Co.', 'Caribbean Cayman Bank', 120000.00, 94, 'Integrator', 750, 350),
('ACT-3021-99', 'Robert Chen', 'FraudShield AI Bank', 5800.00, 74, 'Standard', 120, 280),
('ACT-7712-45', 'Maria Gonzalez', 'FraudShield AI Bank', 1250.00, 8, 'Standard', 150, 320),
('ACT-1102-88', 'James Davidson', 'FraudShield AI Bank', 28000.00, 95, 'Standard', 90, 350),
('ACT-9021-34', 'Amanda Ross', 'FraudShield AI Bank', 950.00, 12, 'Standard', 200, 50);

-- 2. Insert Transactions
INSERT INTO transactions (id, timestamp, sender_id, receiver_id, receiver_bank, amount, type, risk_score, status, flags_raw, geo_ip, location, device) VALUES
('TXN-9021', '2026-06-06 02:45:12+00', 'ACT-4491-09', 'ACT-8812-76', 'Zenith Global Trust', 14500.00, 'Wire', 88, 'Flagged', 'Geographic Velocity Mismatch,High Transaction Volume', '185.220.101.4', 'Frankfurt, DE (via VPN)', 'Mozilla/5.0 (Linux; Android 11)'),
('TXN-9022', '2026-06-06 02:30:45+00', 'ACT-3021-99', 'BTC-Wallet-3px90a1', 'Sovereign Crypto Bank', 4890.00, 'P2P', 74, 'Under Review', 'Rapid Funds Turnover,Crypto-Related Beneficiary', '92.119.177.30', 'Reykjavik, IS', 'Brave/Windows 10'),
('TXN-9023', '2026-06-06 02:12:00+00', 'ACT-7712-45', 'ACT-1090-33', 'Metro Credit Union', 124.50, 'Card', 8, 'Cleared', '', '73.14.99.112', 'Austin, TX, US', 'Apple Pay (iPhone 15)'),
('TXN-9024', '2026-06-06 01:58:30+00', 'ACT-1102-88', 'ACT-2244-90', 'First Offshore Corp', 25000.00, 'Wire', 95, 'Blocked', 'Sanctioned Jurisdiction Route,New Beneficiary Account', '46.19.141.12', 'Nicosia, CY', 'Safari/macOS 14'),
('TXN-9025', '2026-06-06 01:40:15+00', 'ACT-9021-34', 'ACT-4491-09', 'FraudShield AI Bank', 600.00, 'Internal', 12, 'Cleared', 'Trusted Peer Network', '68.80.201.55', 'Philadelphia, PA, US', 'Chrome/macOS');

-- 3. Insert IP Alerts
INSERT INTO alerts (id, timestamp, ip_address, country, risk_score, velocity_mismatch, device_signature, action_taken) VALUES
('GEO-001', '2026-06-06 02:45:12+00', '185.220.101.4', 'Germany', 88, TRUE, 'Android 11 Mobile', 'Challenged'),
('GEO-002', '2026-06-06 01:58:30+00', '46.19.141.12', 'Cyprus', 95, TRUE, 'Safari Mac 14', 'Blocked'),
('GEO-003', '2026-06-06 02:30:45+00', '92.119.177.30', 'Iceland', 74, FALSE, 'Brave Browser Win 10', 'Allowed'),
('GEO-004', '2026-06-06 03:01:00+00', '82.102.23.109', 'Russia', 99, TRUE, 'Tor Exit Node', 'Blocked');

-- 4. Insert Complaints
INSERT INTO complaints (id, date, customer_name, account_id, dispute_type, amount, status, details) VALUES
('CMP-701', '2026-06-06 01:22:00+00', 'Sarah Jenkins', 'ACT-4491-09', 'Unauthorized Wire', 14500.00, 'Pending Review', 'Customer reports receiving an SMS link requesting security code validation, after which a wire transfer for $14,500 was dispatched without consent.'),
('CMP-702', '2026-06-05 18:40:00+00', 'Jonathan Davis', 'ACT-1102-88', 'Card Skimming', 450.00, 'Chargeback Initiated', 'Physical ATM card cloned and used for cash out in Las Vegas while customer maintains physical custody of the card in Chicago.'),
('CMP-703', '2026-06-04 11:30:00+00', 'Aria Patel', 'ACT-9021-34', 'Phishing Transfer', 2800.00, 'Resolved - Refunded', 'Fake banking portal login led to compromised credentials. Recovered via insurance waiver.');

-- 5. Insert Investigations Cases
INSERT INTO investigations (id, title, description, severity, status, assignee) VALUES
('CASE-2026-01', 'Phishing Ring Targeting High-Net-Worth Accounts', 'Suspicious credential harvesting and geography velocity mismatches detected across multiple retail accounts. Threat actors routing funds to Apex Digital LLC.', 'Critical', 'Under Review', 'Alice Vance'),
('CASE-2026-02', 'Smurfing Campaign (Structured Crypto Deposits)', 'Structured small-amount P2P and ACH deposits executing daily below report thresholds, subsequently merged and forwarded to crypto exit wallets.', 'High', 'Escalated', 'Marcus Brody'),
('CASE-2026-03', 'Identity Mismatch: Direct Deposit Fraud', 'ACH direct deposits originating from external corporate payroll matching names that differ from account owners.', 'Medium', 'Reported', 'Sarah Connor');

-- 6. Map transactions to cases
INSERT INTO investigation_transactions (case_id, transaction_id) VALUES
('CASE-2026-01', 'TXN-9021'),
('CASE-2026-01', 'TXN-9024'),
('CASE-2026-02', 'TXN-9022');

-- 7. Insert case notes
INSERT INTO investigation_notes (case_id, author, text) VALUES
('CASE-2026-01', 'Alice Vance', 'Spoke with customer David. He confirmed receiving a fraudulent text about account suspension. Classic credential phishing.'),
('CASE-2026-01', 'System Alert', 'Urgent: Flagged transaction TXN-9021 linked to the same compromise node.'),
('CASE-2026-02', 'Marcus Brody', 'Aggregate layering amount has exceeded $100k. Preparing SAR documents.');

-- 8. Insert timeline audits
INSERT INTO investigation_timeline (case_id, action, user_identity, details) VALUES
('CASE-2026-01', 'Case Created', 'System Alert', 'Auto-triggered by multiple logins mismatch velocity.'),
('CASE-2026-01', 'Investigator Assigned', 'Alice Vance', 'Assigned to self. Commencing geo velocity check.'),
('CASE-2026-01', 'Transaction Blocked', 'Alice Vance', 'Blocked TXN-9024 routing to First Offshore Corp ($25k).'),
('CASE-2026-02', 'Case Opened', 'System Alert', 'Repetitive structuring thresholds triggered.'),
('CASE-2026-02', 'Escalation to Legal', 'Marcus Brody', 'Filing Suspicious Activity Report (SAR).');
