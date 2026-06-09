"""
POST /predict endpoint — Real ML fraud detection inference.
Loads the ExtraTreesClassifier and runs prediction on 17 input features.
"""

import logging
from fastapi import APIRouter, HTTPException
from models.schemas import PredictRequest, PredictResponse
from ml.model import predict_fraud

# Setup router
router = APIRouter(prefix="/predict", tags=["Predict / Score"])
logger = logging.getLogger("routes.predict")


@router.post("", response_model=PredictResponse)
def execute_prediction(payload: PredictRequest):
    """
    Accept 17 transaction features, run the real ExtraTrees fraud classifier,
    and return fraud probability, risk tier, and trigger flags.
    """
    try:
        # Build raw features dict from request
        raw_features = {
            "F115": payload.F115,
            "F321": payload.F321,
            "F527": payload.F527,
            "F531": payload.F531,
            "F670": payload.F670,
            "F1692": payload.F1692,
            "F2082": payload.F2082,
            "F2122": payload.F2122,
            "F2582": payload.F2582,
            "F2678": payload.F2678,
            "F2737": payload.F2737,
            "F2956": payload.F2956,
            "F3836": payload.F3836,
            "F3887": payload.F3887,
            "F3894": payload.F3894,
            "F3889": payload.F3889,
            "F3891": payload.F3891,
        }

        # Run inference
        result = predict_fraud(raw_features)

        return PredictResponse(
            fraud_probability=result["fraud_probability"],
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            triggers=result["triggers"],
        )

    except RuntimeError as e:
        logger.error(f"Model unavailable: {e}")
        raise HTTPException(
            status_code=503,
            detail="Fraud detection classifier model is currently offline or uninitialized."
        )
    except Exception as e:
        logger.error(f"Prediction execution runtime error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal execution error during model scoring: {str(e)}"
        )
