"""
Real fraud detection model inference wrapper.
Loads the ExtraTreesClassifier trained on the official Bank of Baroda hackathon dataset.
Handles one-hot encoding of categorical features F3889 and F3891 at inference time.
"""

import os
import logging
from typing import Dict, List, Tuple
import joblib
import pandas as pd
import numpy as np

logger = logging.getLogger("ml.model")

# Path to the trained model
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "model2.pkl")

# The exact feature column order the model was trained on
# (15 numeric + 7 F3889 one-hot + 7 F3891 one-hot = 29 columns)
NUMERIC_FEATURES = [
    "F115", "F321", "F527", "F531", "F670",
    "F1692", "F2082", "F2122", "F2582", "F2678",
    "F2737", "F2956", "F3836", "F3887", "F3894"
]

F3889_CATEGORIES = ["G365D", "L365D", "L180D", "L90D", "L31D", "L14D", "L7D"]
F3891_CATEGORIES = ["selfemployed", "student", "salaried", "agriculture", "housewife", "retired", "others"]

# Full trained column order (must match training script's output exactly)
TRAINED_COLUMNS = NUMERIC_FEATURES + F3889_CATEGORIES + F3891_CATEGORIES

# Human-readable feature labels for trigger generation
FEATURE_DESCRIPTIONS = {
    "F115": "Account Activity Ratio",
    "F321": "Transaction Velocity Index",
    "F527": "Cross-Border Payment Ratio",
    "F531": "Peer Transaction Deviation",
    "F670": "Channel Switch Indicator",
    "F1692": "IP Geolocation Mismatch Flag",
    "F2082": "Device Fingerprint Anomaly",
    "F2122": "Session Behavior Score",
    "F2582": "Historical Fraud Proximity Index",
    "F2678": "Beneficiary Risk Aggregation",
    "F2737": "Velocity Spike Coefficient",
    "F2956": "Transaction Amount Quantile",
    "F3836": "Cumulative Outflow Volume",
    "F3887": "Account Age (Days)",
    "F3894": "Customer Profile Score",
    "F3889": "Account Tenure Window",
    "F3891": "Occupation Category",
}

# Thresholds for trigger generation (based on dataset analysis)
TRIGGER_THRESHOLDS = {
    "F115": {"high": 0.8, "desc": "Abnormally high account activity ratio detected"},
    "F321": {"high": 1.5, "desc": "Transaction velocity exceeds safe threshold"},
    "F527": {"high": 1.0, "desc": "Elevated cross-border payment ratio"},
    "F531": {"high": 1.2, "desc": "Peer transaction deviation beyond normal bounds"},
    "F670": {"high": 0.5, "desc": "Unusual channel switching behavior detected"},
    "F1692": {"high": 0.5, "desc": "IP geolocation mismatch flagged"},
    "F2082": {"high": 0.5, "desc": "Device fingerprint anomaly detected"},
    "F2122": {"high": 0.05, "desc": "Suspicious session behavior pattern"},
    "F2582": {"high": 0.5, "desc": "Historical fraud proximity index elevated"},
    "F2678": {"high": 0.5, "desc": "Beneficiary risk aggregation score high"},
    "F2737": {"high": 0.5, "desc": "Velocity spike coefficient above threshold"},
    "F2956": {"high": 80.0, "desc": "Transaction amount in high-risk quantile"},
    "F3836": {"high": 100000, "desc": "Cumulative outflow volume exceeds monitoring threshold"},
    "F3887": {"high": 200, "desc": "Account age suggests mature mule pattern"},
    "F3894": {"high": 40, "desc": "Customer profile score indicates risk"},
}


def load_model():
    """Load the trained ExtraTrees model from disk."""
    try:
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found at: {MODEL_PATH}")
            return None
        model = joblib.load(MODEL_PATH)
        logger.info(f"Fraud detection model loaded successfully from {MODEL_PATH}")
        return model
    except Exception as e:
        logger.error(f"Error loading fraud model: {e}")
        return None


# Load model at module import time
_model = load_model()


def _one_hot_encode_features(raw_features: Dict) -> pd.DataFrame:
    """
    Convert raw 17-feature input dict into a 29-column DataFrame
    matching the exact training schema.
    
    Handles one-hot encoding for F3889 and F3891 categorical variables.
    """
    row = {}

    # Copy numeric features
    for feat in NUMERIC_FEATURES:
        row[feat] = float(raw_features.get(feat, 0.0))

    # One-hot encode F3889
    f3889_value = str(raw_features.get("F3889", "")).strip()
    for cat in F3889_CATEGORIES:
        row[cat] = 1 if f3889_value == cat else 0

    # One-hot encode F3891
    f3891_value = str(raw_features.get("F3891", "")).strip()
    for cat in F3891_CATEGORIES:
        row[cat] = 1 if f3891_value == cat else 0

    # Build DataFrame with exact column order
    df = pd.DataFrame([row], columns=TRAINED_COLUMNS)
    return df


def _generate_triggers(raw_features: Dict, fraud_prob: float) -> List[str]:
    """
    Generate human-readable trigger flags based on feature values
    and the fraud probability.
    """
    triggers = []

    # Check numeric features against thresholds
    for feat, config in TRIGGER_THRESHOLDS.items():
        value = raw_features.get(feat)
        if value is not None:
            try:
                val = float(value)
                if val >= config["high"]:
                    triggers.append(config["desc"])
            except (ValueError, TypeError):
                pass

    # Check categorical features
    f3889 = str(raw_features.get("F3889", ""))
    if f3889 in ("L7D", "L14D"):
        triggers.append("Recently opened account tenure window — heightened monitoring")

    f3891 = str(raw_features.get("F3891", ""))
    if f3891 == "others":
        triggers.append("Unclassified occupation category — enhanced due diligence required")

    # High probability triggers
    if fraud_prob >= 0.9:
        triggers.append("CRITICAL: Model confidence exceeds 90% fraud probability")
    elif fraud_prob >= 0.7:
        triggers.append("WARNING: Model indicates elevated fraud probability")

    # Ensure at least one trigger
    if not triggers:
        if fraud_prob >= 0.5:
            triggers.append("General risk factors detected by ensemble classifier")
        else:
            triggers.append("No significant anomalies detected — within normal bounds")

    return triggers


def predict_fraud(raw_features: Dict) -> Dict:
    """
    Run fraud prediction on raw 17-feature input.
    
    Args:
        raw_features: Dict with keys F115, F321, ..., F3894, F3889, F3891
        
    Returns:
        Dict with fraud_probability, risk_score, risk_level, triggers
    """
    global _model

    if _model is None:
        _model = load_model()
        if _model is None:
            raise RuntimeError("Fraud detection model is not available")

    # Build feature DataFrame
    feature_df = _one_hot_encode_features(raw_features)

    # Run prediction
    proba = _model.predict_proba(feature_df)

    # proba shape: [[prob_class_0, prob_class_1]]
    # Class 1 = fraud
    fraud_prob = float(proba[0][1]) if proba.shape[1] > 1 else float(proba[0][0])

    # Calculate risk score (0-100)
    risk_score = round(fraud_prob * 100.0, 2)

    # Determine risk level
    if risk_score >= 80.0:
        risk_level = "Critical"
    elif risk_score >= 50.0:
        risk_level = "High"
    elif risk_score >= 25.0:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Generate trigger flags
    triggers = _generate_triggers(raw_features, fraud_prob)

    return {
        "fraud_probability": round(fraud_prob, 6),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "triggers": triggers,
    }
