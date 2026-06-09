// Mock Data for FraudShield AI

export interface Transaction {
  id: string;
  timestamp: string;
  sender: string;
  senderAccount: string;
  receiver: string;
  receiverAccount: string;
  receiverBank: string;
  amount: number;
  type: 'Wire' | 'ACH' | 'P2P' | 'Card' | 'Internal';
  riskScore: number;
  status: 'Flagged' | 'Cleared' | 'Under Review' | 'Blocked';
  flags: string[];
  geoIp: string;
  location: string;
  device: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  bank: string;
  riskScore: number;
  balance: number;
  type: 'Mule Hub' | 'Smurf' | 'Integrator' | 'Standard';
  x: number;
  y: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  amount: number;
  timestamp: string;
}

export interface MoneyFlowHop {
  hop: number;
  accountId: string;
  owner: string;
  bank: string;
  amountReceived: number;
  amountSent: number;
  timestamp: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Reported' | 'Under Review' | 'Escalated' | 'Closed';
  assignee: string;
  relatedTransactions: string[];
  description: string;
  timeline: {
    time: string;
    action: string;
    user: string;
    details: string;
  }[];
  notes: {
    id: string;
    author: string;
    time: string;
    text: string;
  }[];
}

export interface Complaint {
  id: string;
  date: string;
  customerName: string;
  accountId: string;
  disputeType: 'Unauthorized Wire' | 'Card Skimming' | 'Phishing Transfer' | 'Identity Theft' | 'ACH Dispute';
  amount: number;
  status: 'Pending Review' | 'Chargeback Initiated' | 'Resolved - Refunded' | 'Resolved - Dismissed';
  details: string;
}

export interface GeoAlert {
  id: string;
  timestamp: string;
  ipAddress: string;
  country: string;
  riskScore: number;
  velocityMismatch: boolean; // login mismatch within physically impossible time
  deviceSignature: string;
  actionTaken: 'Blocked' | 'Challenged' | 'Allowed';
  lat: number;
  lng: number;
}

export interface SimulationRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  conditions: string;
  action: 'Flag' | 'Block' | 'Step-up MFA' | 'Hold';
  status: 'Active' | 'Inactive' | 'Draft';
  statistics: {
    triggerCount: number;
    truePositives: number;
    falsePositives: number;
  };
}

// Data Sets
export const systemStatus = {
  threatLevel: 'Elevated (DEFCON 3)',
  activeAlerts: 42,
  falsePositiveRate: '2.4%',
  fraudPreventedToday: 184500,
  openInvestigations: 18,
};

export const transactionsMockData: Transaction[] = [
  {
    id: 'TXN-9021',
    timestamp: '2026-06-06 02:45:12',
    sender: 'Sarah Jenkins',
    senderAccount: 'ACT-4491-09',
    receiver: 'Apex Digital LLC',
    receiverAccount: 'ACT-8812-76',
    receiverBank: 'Zenith Global Trust',
    amount: 14500.00,
    type: 'Wire',
    riskScore: 88,
    status: 'Flagged',
    flags: ['Geographic Velocity Mismatch', 'High Transaction Volume'],
    geoIp: '185.220.101.4',
    location: 'Frankfurt, DE (via VPN)',
    device: 'Mozilla/5.0 (Linux; Android 11)',
  },
  {
    id: 'TXN-9022',
    timestamp: '2026-06-06 02:30:45',
    sender: 'Robert Chen',
    senderAccount: 'ACT-3021-99',
    receiver: 'CryptoCash Inc.',
    receiverAccount: 'ACT-0099-23',
    receiverBank: 'Sovereign Crypto Bank',
    amount: 4890.00,
    type: 'P2P',
    riskScore: 74,
    status: 'Under Review',
    flags: ['Rapid Funds Turnover', 'Crypto-Related Beneficiary'],
    geoIp: '92.119.177.30',
    location: 'Reykjavik, IS',
    device: 'Brave/Windows 10',
  },
  {
    id: 'TXN-9023',
    timestamp: '2026-06-06 02:12:00',
    sender: 'Maria Gonzalez',
    senderAccount: 'ACT-7712-45',
    receiver: 'Local Supermarket',
    receiverAccount: 'ACT-5541-10',
    receiverBank: 'Metro Credit Union',
    amount: 124.50,
    type: 'Card',
    riskScore: 8,
    status: 'Cleared',
    flags: [],
    geoIp: '73.14.99.112',
    location: 'Austin, TX, US',
    device: 'Apple Pay (iPhone 15)',
  },
  {
    id: 'TXN-9024',
    timestamp: '2026-06-06 01:58:30',
    sender: 'James Davidson',
    senderAccount: 'ACT-1102-88',
    receiver: 'Unknown Beneficiary',
    receiverAccount: 'ACT-6632-19',
    receiverBank: 'First Offshore Corp',
    amount: 25000.00,
    type: 'Wire',
    riskScore: 95,
    status: 'Blocked',
    flags: ['Sanctioned Jurisdiction Route', 'New Beneficiary Account'],
    geoIp: '46.19.141.12',
    location: 'Nicosia, CY',
    device: 'Safari/macOS 14',
  },
  {
    id: 'TXN-9025',
    timestamp: '2026-06-06 01:40:15',
    sender: 'Amanda Ross',
    senderAccount: 'ACT-9021-34',
    receiver: 'Thomas Ross',
    receiverAccount: 'ACT-9021-02',
    receiverBank: 'FraudShield AI Bank',
    amount: 600.00,
    type: 'Internal',
    riskScore: 12,
    status: 'Cleared',
    flags: ['Trusted Peer Network'],
    geoIp: '68.80.201.55',
    location: 'Philadelphia, PA, US',
    device: 'Chrome/macOS',
  },
  {
    id: 'TXN-9026',
    timestamp: '2026-06-06 01:10:00',
    sender: 'David Kim',
    senderAccount: 'ACT-1090-33',
    receiver: 'QuickPay Ltd.',
    receiverAccount: 'ACT-2244-90',
    receiverBank: 'Global Offshore Bank',
    amount: 9500.00,
    type: 'ACH',
    riskScore: 68,
    status: 'Under Review',
    flags: ['Structuring Threshold Alert', 'Dormant Account Reactivation'],
    geoIp: '198.51.100.22',
    location: 'Seattle, WA, US',
    device: 'Firefox/Linux',
  },
  {
    id: 'TXN-9027',
    timestamp: '2026-06-05 23:45:00',
    sender: 'Linda Henderson',
    senderAccount: 'ACT-6678-21',
    receiver: 'GiftCard Depot',
    receiverAccount: 'ACT-8833-21',
    receiverBank: 'Retailers Commerce Bank',
    amount: 1500.00,
    type: 'Card',
    riskScore: 54,
    status: 'Cleared',
    flags: ['High Volume Gift Card Purchase'],
    geoIp: '172.56.21.90',
    location: 'Denver, CO, US',
    device: 'Chrome/Android 13',
  },
  {
    id: 'TXN-9028',
    timestamp: '2026-06-05 23:22:15',
    sender: 'Alex Mercer',
    senderAccount: 'ACT-5509-02',
    receiver: 'P2P Transfer Inc',
    receiverAccount: 'ACT-7711-22',
    receiverBank: 'NeoBank Tech',
    amount: 3200.00,
    type: 'P2P',
    riskScore: 40,
    status: 'Cleared',
    flags: [],
    geoIp: '99.88.77.66',
    location: 'Portland, OR, US',
    device: 'Safari/iOS 17',
  }
];

export const muleNodesMock: NetworkNode[] = [
  { id: 'N1', label: 'Primary Deposit (Sarah Jenkins)', bank: 'FraudShield AI Bank', riskScore: 88, balance: 14500, type: 'Standard', x: 100, y: 200 },
  { id: 'N2', label: 'Mule Account A (Hub)', bank: 'Offshore Finance', riskScore: 96, balance: 84000, type: 'Mule Hub', x: 300, y: 200 },
  { id: 'N3', label: 'Mule Account B (Smurf)', bank: 'Apex Digital Bank', riskScore: 82, balance: 12000, type: 'Smurf', x: 500, y: 100 },
  { id: 'N4', label: 'Mule Account C (Smurf)', bank: 'Vanguard Retail', riskScore: 78, balance: 15000, type: 'Smurf', x: 500, y: 300 },
  { id: 'N5', label: 'Crypto Exchange (Exit Node)', bank: 'Sovereign Crypto Bank', riskScore: 99, balance: 350000, type: 'Integrator', x: 750, y: 200 },
  { id: 'N6', label: 'Secondary Deposit (Dormant Node)', bank: 'FraudShield AI Bank', riskScore: 45, balance: 3200, type: 'Standard', x: 100, y: 100 },
  { id: 'N7', label: 'External Shell Co.', bank: 'Caribbean Cayman Bank', riskScore: 94, balance: 120000, type: 'Integrator', x: 750, y: 350 },
];

export const muleLinksMock: NetworkLink[] = [
  { source: 'N1', target: 'N2', amount: 14500, timestamp: '2026-06-06 02:45' },
  { source: 'N6', target: 'N2', amount: 3000, timestamp: '2026-06-06 01:10' },
  { source: 'N2', target: 'N3', amount: 9500, timestamp: '2026-06-06 03:00' },
  { source: 'N2', target: 'N4', amount: 12000, timestamp: '2026-06-06 03:15' },
  { source: 'N3', target: 'N5', amount: 9200, timestamp: '2026-06-06 04:00' },
  { source: 'N4', target: 'N5', amount: 11500, timestamp: '2026-06-06 04:20' },
  { source: 'N2', target: 'N7', amount: 50000, timestamp: '2026-06-06 04:30' },
];

export const moneyFlowTraceMock: MoneyFlowHop[] = [
  {
    hop: 0,
    accountId: 'ACT-4491-09',
    owner: 'Sarah Jenkins (Victim)',
    bank: 'FraudShield AI Bank',
    amountReceived: 0,
    amountSent: 14500,
    timestamp: '2026-06-06 02:45:12',
    riskLevel: 'Low',
    status: 'Compromised via Phishing Link',
  },
  {
    hop: 1,
    accountId: 'ACT-8812-76',
    owner: 'Apex Digital LLC (Mule Layer 1)',
    bank: 'Zenith Global Trust',
    amountReceived: 14500,
    amountSent: 14000,
    timestamp: '2026-06-06 03:05:00',
    riskLevel: 'High',
    status: 'Rapid Outflow / Layering',
  },
  {
    hop: 2,
    accountId: 'ACT-0099-23',
    owner: 'M. R. Laundering Corp (Mule Layer 2)',
    bank: 'Sovereign Crypto Bank',
    amountReceived: 14000,
    amountSent: 13800,
    timestamp: '2026-06-06 03:30:00',
    riskLevel: 'Critical',
    status: 'Integration / Conversion to Bitcoin',
  },
  {
    hop: 3,
    accountId: 'BTC-Wallet-3px90a1',
    owner: 'External Unhosted Wallet (Exit Node)',
    bank: 'Blockchain Ledger',
    amountReceived: 13800,
    amountSent: 0,
    timestamp: '2026-06-06 03:45:00',
    riskLevel: 'Critical',
    status: 'Funds Withdrawn / Offshore',
  }
];

export const investigationCasesMock: InvestigationCase[] = [
  {
    id: 'CASE-2026-01',
    title: 'Phishing Ring Targeting High-Net-Worth Accounts',
    createdAt: '2026-06-05 14:22',
    updatedAt: '2026-06-06 02:46',
    severity: 'Critical',
    status: 'Under Review',
    assignee: 'Alice Vance',
    relatedTransactions: ['TXN-9021', 'TXN-9024'],
    description: 'Suspicious credential harvesting and geography velocity mismatches detected across multiple retail accounts. Threat actors routing funds to Apex Digital LLC.',
    timeline: [
      { time: '2026-06-05 14:22', action: 'Case Created', user: 'System Alert', details: 'Auto-triggered by multiple logins mismatch velocity.' },
      { time: '2026-06-05 15:30', action: 'Investigator Assigned', user: 'Alice Vance', details: 'Assigned to self. Commencing geo velocity check.' },
      { time: '2026-06-06 02:46', action: 'Transaction Blocked', user: 'Alice Vance', details: 'Blocked TXN-9024 routing to First Offshore Corp ($25k).' },
    ],
    notes: [
      { id: 'n1', author: 'Alice Vance', time: '2026-06-05 16:00', text: 'Spoke with customer David. He confirmed receiving a fraudulent text about account suspension. Classic credential phishing.' },
      { id: 'n2', author: 'System Alert', time: '2026-06-06 02:45', text: 'Urgent: Flagged transaction TXN-9021 linked to the same compromise node.' }
    ]
  },
  {
    id: 'CASE-2026-02',
    title: 'Smurfing Campaign (Structured Crypto Deposits)',
    createdAt: '2026-06-04 10:15',
    updatedAt: '2026-06-05 23:22',
    severity: 'High',
    status: 'Escalated',
    assignee: 'Marcus Brody',
    relatedTransactions: ['TXN-9022', 'TXN-9026'],
    description: 'Structured small-amount P2P and ACH deposits executing daily below report thresholds, subsequently merged and forwarded to crypto exit wallets.',
    timeline: [
      { time: '2026-06-04 10:15', action: 'Case Opened', user: 'System Alert', details: 'Repetitive structuring thresholds triggered.' },
      { time: '2026-06-05 11:00', action: 'Escalation to Legal', user: 'Marcus Brody', details: 'Filing Suspicious Activity Report (SAR).' }
    ],
    notes: [
      { id: 'n3', author: 'Marcus Brody', time: '2026-06-05 10:50', text: 'Aggregate layering amount has exceeded $100k. Preparing SAR documents.' }
    ]
  },
  {
    id: 'CASE-2026-03',
    title: 'Identity Mismatch: Direct Deposit Fraud',
    createdAt: '2026-06-03 08:00',
    updatedAt: '2026-06-05 12:00',
    severity: 'Medium',
    status: 'Reported',
    assignee: 'Sarah Connor',
    relatedTransactions: [],
    description: 'ACH direct deposits originating from external corporate payroll matching names that differ from account owners.',
    timeline: [
      { time: '2026-06-03 08:00', action: 'Case Flagged', user: 'Batch System', details: 'Name mismatch on ACH inbound.' }
    ],
    notes: []
  }
];

export const complaintsMockData: Complaint[] = [
  {
    id: 'CMP-701',
    date: '2026-06-06 01:22',
    customerName: 'Sarah Jenkins',
    accountId: 'ACT-4491-09',
    disputeType: 'Unauthorized Wire',
    amount: 14500.00,
    status: 'Pending Review',
    details: 'Customer reports receiving an SMS link requesting security code validation, after which a wire transfer for $14,500 was dispatched without consent.',
  },
  {
    id: 'CMP-702',
    date: '2026-06-05 18:40',
    customerName: 'Jonathan Davis',
    accountId: 'ACT-1102-88',
    disputeType: 'Card Skimming',
    amount: 450.00,
    status: 'Chargeback Initiated',
    details: 'Physical ATM card cloned and used for cash out in Las Vegas while customer maintains physical custody of the card in Chicago.',
  },
  {
    id: 'CMP-703',
    date: '2026-06-04 11:30',
    customerName: 'Aria Patel',
    accountId: 'ACT-3044-12',
    disputeType: 'Phishing Transfer',
    amount: 2800.00,
    status: 'Resolved - Refunded',
    details: 'Fake banking portal login led to compromised credentials. Recovered via insurance waiver.',
  }
];

export const geoAlertsMock: GeoAlert[] = [
  {
    id: 'GEO-001',
    timestamp: '2026-06-06 02:45:12',
    ipAddress: '185.220.101.4',
    country: 'Germany',
    riskScore: 88,
    velocityMismatch: true,
    deviceSignature: 'Android 11 Mobile',
    actionTaken: 'Challenged',
    lat: 50.1109,
    lng: 8.6821,
  },
  {
    id: 'GEO-002',
    timestamp: '2026-06-06 01:58:30',
    ipAddress: '46.19.141.12',
    country: 'Cyprus',
    riskScore: 95,
    velocityMismatch: true,
    deviceSignature: 'Safari Mac 14',
    actionTaken: 'Blocked',
    lat: 35.1856,
    lng: 33.3823,
  },
  {
    id: 'GEO-003',
    timestamp: '2026-06-06 02:30:45',
    ipAddress: '92.119.177.30',
    country: 'Iceland',
    riskScore: 74,
    velocityMismatch: false,
    deviceSignature: 'Brave Browser Win 10',
    actionTaken: 'Allowed',
    lat: 64.1466,
    lng: -21.9426,
  },
  {
    id: 'GEO-004',
    timestamp: '2026-06-06 03:01:00',
    ipAddress: '82.102.23.109',
    country: 'Russia',
    riskScore: 99,
    velocityMismatch: true,
    deviceSignature: 'Tor Exit Node',
    actionTaken: 'Blocked',
    lat: 55.7558,
    lng: 37.6173,
  }
];

export const simulationRulesMock: SimulationRule[] = [
  {
    id: 'RULE-001',
    name: 'Impossible Travel / Speed Mismatch',
    description: 'Trigger when logins are recorded from coordinates whose distance exceeds travel speed thresholds.',
    triggerEvent: 'Login Attempt',
    conditions: 'VelocityMismatch == True AND GeoDistance > 800 miles AND TimeInterval < 1 hour',
    action: 'Block',
    status: 'Active',
    statistics: {
      triggerCount: 412,
      truePositives: 395,
      falsePositives: 17,
    }
  },
  {
    id: 'RULE-002',
    name: 'Rapid Funds Rotation (Smurfing)',
    description: 'Detect dynamic layering pattern: multiple incoming deposits followed by rapid full-amount offshore wire.',
    triggerEvent: 'Outbound Transfer',
    conditions: 'InflowTxnsCount >= 3 (within 24 hrs) AND InflowVolumeSum >= 90% OutflowAmount',
    action: 'Hold',
    status: 'Active',
    statistics: {
      triggerCount: 189,
      truePositives: 165,
      falsePositives: 24,
    }
  },
  {
    id: 'RULE-003',
    name: 'Sanctioned Jurisdictions Outflow',
    description: 'Hold all outbound wire transfers where recipient bank is routed through High-Risk/Sanctioned country nodes.',
    triggerEvent: 'Outbound Wire',
    conditions: 'RecipientBankCountry IN (SanctionsList)',
    action: 'Block',
    status: 'Active',
    statistics: {
      triggerCount: 32,
      truePositives: 32,
      falsePositives: 0,
    }
  },
  {
    id: 'RULE-004',
    name: 'High-Value Cryptocash Exit',
    description: 'Trigger MFA challenge for internal/P2P transfers to known crypto broker API wallets above $2k.',
    triggerEvent: 'Internal/P2P Transfer',
    conditions: 'BeneficiaryAccount IN (CryptoExchanges) AND Amount > 2000.00',
    action: 'Step-up MFA',
    status: 'Draft',
    statistics: {
      triggerCount: 1540,
      truePositives: 410,
      falsePositives: 1130,
    }
  }
];
