from sqlalchemy.orm import Session
from models.db_models import Account, Transaction
from typing import Dict, List, Any
from datetime import datetime

class FlowService:
    @staticmethod
    def trace_money_flow(db: Session, victim_id: str, max_depth: int = 3) -> Dict[str, Any]:
        """
        Traces the downstream flow of money starting from a victim account.
        Returns a dictionary containing nodes and links representation of the transaction chain,
        suitable for rendering a Sankey diagram.
        """
        # Get victim account
        victim = db.query(Account).filter(Account.id == victim_id).first()
        if not victim:
            return {"nodes": [], "links": [], "error": "Account not found"}
            
        nodes = {}
        links = []
        
        # Add victim node
        nodes[victim.id] = {
            "id": victim.id,
            "label": victim.label,
            "bank": victim.bank,
            "balance": victim.balance,
            "risk_score": victim.risk_score,
            "type": victim.type,
            "hop": 0
        }
        
        # Queue elements format: (account_id, last_timestamp, current_depth)
        queue = [(victim.id, None, 0)]
        visited_txns = set()
        
        while queue:
            curr_id, last_timestamp, depth = queue.pop(0)
            if depth >= max_depth:
                continue
                
            # Query outgoing transactions from this account
            query = db.query(Transaction).filter(Transaction.sender_id == curr_id)
            if last_timestamp:
                query = query.filter(Transaction.timestamp >= last_timestamp)
                
            txns = query.order_by(Transaction.timestamp.asc()).all()
            
            for tx in txns:
                if tx.id in visited_txns:
                    continue
                visited_txns.add(tx.id)
                
                receiver_id = tx.receiver_id
                
                # Retrieve receiver account details if it exists in DB
                receiver_acc = db.query(Account).filter(Account.id == receiver_id).first()
                
                if receiver_id not in nodes:
                    if receiver_acc:
                        rec_label = receiver_acc.label
                        rec_type = receiver_acc.type
                        rec_bank = receiver_acc.bank
                        rec_balance = receiver_acc.balance
                        rec_risk = receiver_acc.risk_score
                    else:
                        # External entity
                        rec_label = f"External Recipient ({tx.receiver_bank})"
                        rec_type = "External"
                        rec_bank = tx.receiver_bank
                        rec_balance = 0.0
                        rec_risk = tx.risk_score
                        
                    nodes[receiver_id] = {
                        "id": receiver_id,
                        "label": rec_label,
                        "bank": rec_bank,
                        "balance": rec_balance,
                        "risk_score": rec_risk,
                        "type": rec_type,
                        "hop": depth + 1
                    }
                else:
                    # Update hop level if a shorter path was found
                    nodes[receiver_id]["hop"] = min(nodes[receiver_id]["hop"], depth + 1)
                    
                links.append({
                    "id": tx.id,
                    "source": curr_id,
                    "target": receiver_id,
                    "receiver_bank": tx.receiver_bank,
                    "amount": float(tx.amount),
                    "timestamp": tx.timestamp.isoformat() if isinstance(tx.timestamp, datetime) else str(tx.timestamp),
                    "risk_score": tx.risk_score,
                    "type": tx.type,
                    "status": tx.status
                })
                
                # Queue receiver for next hop
                queue.append((receiver_id, tx.timestamp, depth + 1))
                
        return {
            "nodes": list(nodes.values()),
            "links": links
        }
