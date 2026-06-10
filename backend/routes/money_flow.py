from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
from database.connection import get_db
from services.flow_service import FlowService

router = APIRouter(prefix="/money-flow", tags=["Money Flow Tracing"])

@router.get("/{account_id}", response_model=Dict[str, Any])
def get_money_flow_trace(
    account_id: str,
    depth: int = Query(3, ge=1, le=5, description="Maximum path depth for flow tracing"),
    db: Session = Depends(get_db)
):
    """
    Traces the chronological downstream flow of funds from a victim account.
    Returns a node-link representation suitable for rendering a Sankey diagram.
    """
    trace_data = FlowService.trace_money_flow(db, account_id, max_depth=depth)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])
        
    return trace_data
