from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models.db_models import Account, Transaction

class MuleNetworkBuilder:
    @staticmethod
    def get_network_topology(db: Session) -> Dict[str, List[Any]]:
        """
        Queries all accounts and transactions from the database 
        and formats them as a node-edge graph structure.
        """
        # Fetch accounts (Nodes)
        db_accounts = db.query(Account).all()
        nodes = []
        for acc in db_accounts:
            nodes.append({
                "id": acc.id,
                "label": acc.label,
                "bank": acc.bank,
                "riskScore": acc.risk_score,
                "balance": acc.balance,
                "type": acc.type,
                "x": acc.x,
                "y": acc.y
            })

        # Fetch transactions (Links / Edges)
        db_transactions = db.query(Transaction).all()
        links = []
        for tx in db_transactions:
            links.append({
                "source": tx.sender_id,
                "target": tx.receiver_id,
                "amount": tx.amount,
                "timestamp": tx.timestamp.strftime("%Y-%m-%d %H:%M")
            })

        return {
            "nodes": nodes,
            "links": links
        }
