from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Base configurations
class SchemaBase(BaseModel):
    class Config:
        from_attributes = True

# Account Schemas
class AccountBase(SchemaBase):
    id: str
    label: str
    bank: str
    balance: float
    risk_score: int
    type: str
    x: int
    y: int

class AccountCreate(AccountBase):
    pass

class AccountResponse(AccountBase):
    pass

# Transaction Schemas
class TransactionBase(SchemaBase):
    id: str
    timestamp: datetime
    sender_id: str
    receiver_id: str
    receiver_bank: str
    amount: float
    type: str
    risk_score: int
    status: str
    flags: List[str] = []
    geo_ip: Optional[str] = None
    location: Optional[str] = None
    device: Optional[str] = None

class TransactionCreate(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    receiver_bank: str
    amount: float
    type: str
    geo_ip: Optional[str] = None
    location: Optional[str] = None
    device: Optional[str] = None

class TransactionResponse(TransactionBase):
    pass

# Alert Schemas
class AlertBase(SchemaBase):
    id: str
    timestamp: datetime
    ip_address: str
    country: str
    risk_score: int
    velocity_mismatch: bool
    device_signature: Optional[str] = None
    action_taken: str

class AlertResponse(AlertBase):
    pass

# Complaint Schemas
class ComplaintBase(SchemaBase):
    id: str
    date: datetime
    customer_name: str
    account_id: str
    transaction_id: Optional[str] = None
    dispute_type: str
    amount: float
    status: str
    details: Optional[str] = None

class ComplaintCreate(BaseModel):
    customer_name: str
    account_id: str
    dispute_type: str
    amount: float
    details: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    pass

# Case Notes Schemas
class InvestigationNoteBase(SchemaBase):
    id: int
    case_id: str
    author: str
    text: str
    created_at: datetime

class InvestigationNoteCreate(BaseModel):
    author: str
    text: str

# Case Timeline Schemas
class InvestigationTimelineBase(SchemaBase):
    id: int
    case_id: str
    action: str
    user_identity: str
    details: str
    created_at: datetime

# Investigation Schemas
class InvestigationBase(SchemaBase):
    id: str
    title: str
    description: str
    severity: str
    status: str
    assignee: str
    created_at: datetime
    updated_at: datetime

class InvestigationCreate(BaseModel):
    title: str
    description: str
    severity: str = "Medium"
    assignee: str = "Agent"

# Custom Details Response Schemas

class InvestigationDetailResponse(BaseModel):
    case: InvestigationBase
    timeline: List[InvestigationTimelineBase] = []
    notes: List[InvestigationNoteBase] = []
    linked_transactions: List[TransactionResponse] = []
    linked_accounts: List[AccountResponse] = []

class ComplaintDetailedResponse(BaseModel):
    complaint: ComplaintResponse
    linked_transaction: Optional[TransactionResponse] = None
    connected_accounts: List[AccountResponse] = []

# Predictions (ML) Schemas — 17 features from official BoB dataset
class PredictRequest(BaseModel):
    # 15 Numeric features
    F115: float = Field(..., example=0.53, description="Account Activity Ratio")
    F321: float = Field(..., example=1.09, description="Transaction Velocity Index")
    F527: float = Field(..., example=1.32, description="Cross-Border Payment Ratio")
    F531: float = Field(..., example=1.12, description="Peer Transaction Deviation")
    F670: float = Field(..., example=1.0, description="Channel Switch Indicator")
    F1692: float = Field(..., example=1.0, description="IP Geolocation Mismatch Flag")
    F2082: float = Field(..., example=0.0, description="Device Fingerprint Anomaly")
    F2122: float = Field(..., example=0.009, description="Session Behavior Score")
    F2582: float = Field(..., example=-0.08, description="Historical Fraud Proximity Index")
    F2678: float = Field(..., example=-0.12, description="Beneficiary Risk Aggregation")
    F2737: float = Field(..., example=-0.16, description="Velocity Spike Coefficient")
    F2956: float = Field(..., example=36.0, description="Transaction Amount Quantile")
    F3836: float = Field(..., example=29814.53, description="Cumulative Outflow Volume")
    F3887: float = Field(..., example=170, description="Account Age (Days)")
    F3894: float = Field(..., example=30.0, description="Customer Profile Score")
    # 2 Categorical features
    F3889: str = Field(..., example="G365D", description="Account Tenure Window (G365D, L365D, L180D, L90D, L31D, L14D, L7D)")
    F3891: str = Field(..., example="salaried", description="Occupation Category (selfemployed, student, salaried, agriculture, housewife, retired, others)")

class PredictResponse(BaseModel):
    fraud_probability: float = Field(..., example=0.88)
    risk_score: float = Field(..., example=88.00)
    risk_level: str = Field(..., example="Critical")
    triggers: List[str] = Field(default_factory=list, example=["Transaction velocity exceeds safe threshold"])


# Override Request Schema
class StatusOverrideRequest(BaseModel):
    status: str
