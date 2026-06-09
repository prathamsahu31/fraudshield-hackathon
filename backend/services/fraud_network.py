import networkx as nx
import math
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from models.db_models import Account, Transaction

class FraudNetworkService:
    @staticmethod
    def _pagerank_pure_python(G: nx.DiGraph, alpha: float = 0.85, max_iter: int = 100, tol: float = 1e-6, weight: str = 'amount') -> Dict[str, float]:
        """
        Pure-python PageRank implementation supporting edge weights.
        Prevents runtime crashes on environments missing NumPy/SciPy.
        """
        if len(G) == 0:
            return {}
        
        N = len(G)
        pr = {node: 1.0 / N for node in G}
        
        # Calculate out-weight for each node
        out_weight = {}
        for node in G:
            total = 0.0
            for nbr in G[node]:
                edge_data = G[node][nbr]
                total += float(edge_data.get(weight, 1.0))
            out_weight[node] = total

        for _ in range(max_iter):
            next_pr = {node: 0.0 for node in G}
            dangling_sum = 0.0
            
            for node in G:
                if out_weight[node] == 0.0:
                    dangling_sum += pr[node]
                else:
                    for nbr in G[node]:
                        edge_data = G[node][nbr]
                        w = float(edge_data.get(weight, 1.0))
                        next_pr[nbr] += alpha * pr[node] * w / out_weight[node]
            
            teleport = (1.0 - alpha) / N + alpha * dangling_sum / N
            for node in G:
                next_pr[node] += teleport
            
            err = sum(abs(next_pr[node] - pr[node]) for node in G)
            pr = next_pr
            if err < tol:
                break
                
        return pr

    @staticmethod
    def _compute_grouped_layout(wccs: List[List[str]]) -> Dict[str, List[float]]:
        """
        Calculates cluster node coordinates dynamically grouped as circles on a grid.
        Guarantees that isolated clusters are visually spaced and do not overlap.
        """
        pos = {}
        # Sort components by size descending (largest components at the top)
        sorted_components = sorted(wccs, key=len, reverse=True)
        
        cols = 3
        for idx, component in enumerate(sorted_components):
            row = idx // cols
            col = idx % cols
            
            # Center coordinates for this cluster on the canvas
            x_c = col * 950 + 400
            y_c = row * 950 + 400
            
            comp_size = len(component)
            if comp_size == 1:
                pos[component[0]] = [float(x_c), float(y_c)]
            else:
                # Arrange nodes radially in a circle around the center
                radius = min(350.0, 70.0 + comp_size * 7.5)
                for j, node_id in enumerate(component):
                    angle = (j * 2.0 * math.pi) / comp_size
                    x = x_c + radius * math.cos(angle)
                    y = y_c + radius * math.sin(angle)
                    pos[node_id] = [float(x), float(y)]
                    
        return pos

    @staticmethod
    def analyze_fraud_network(db: Session) -> Dict[str, Any]:
        """
        Creates a NetworkX representation of the transaction database.
        Identifies suspicious clusters, fraud rings, and high centrality nodes.
        Outputs JSON coordinates and schemas compatible with React Flow.
        """
        # 1. Fetch DB raw collections
        accounts = db.query(Account).all()
        transactions = db.query(Transaction).all()

        if not accounts:
            return {"nodes": [], "edges": [], "metadata": {}}

        # 2. Build NetworkX Directed Graph
        G = nx.DiGraph()

        # Map accounts list to dictionaries for lookup
        acc_dict = {}
        for acc in accounts:
            acc_dict[acc.id] = acc
            G.add_node(
                acc.id,
                label=acc.label,
                bank=acc.bank,
                balance=acc.balance,
                risk_score=acc.risk_score,
                type=acc.type
            )

        for tx in transactions:
            # Add edge if both endpoints exist in our nodes list
            if tx.sender_id in acc_dict and tx.receiver_id in acc_dict:
                G.add_edge(
                    tx.sender_id,
                    tx.receiver_id,
                    id=tx.id,
                    amount=tx.amount,
                    risk_score=tx.risk_score
                )

        # 3. Compute Network Centralities
        # Use our robust pure-python PageRank implementation
        pagerank_scores = FraudNetworkService._pagerank_pure_python(G, alpha=0.85, weight='amount')

        # Betweenness centrality represents key transaction bridges/hubs
        betweenness_scores = nx.betweenness_centrality(G)

        # 4. Identify Fraud Rings (Strongly Connected Components size >= 2)
        sccs = [list(c) for c in nx.strongly_connected_components(G) if len(c) > 1]
        
        # Flatten all nodes in rings for easy lookup
        nodes_in_rings = set()
        for ring in sccs:
            nodes_in_rings.update(ring)

        # 5. Identify Suspicious Clusters (Weakly Connected Components with size >= 3 and high avg risk)
        wccs = [list(c) for c in nx.weakly_connected_components(G)]
        suspicious_clusters = []
        cluster_assignments = {} # Maps node_id to cluster index

        for idx, component in enumerate(wccs):
            total_risk = sum(G.nodes[n].get('risk_score', 0) for n in component)
            avg_risk = total_risk / len(component) if component else 0
            
            # Map each node in this component to its cluster ID
            for node_id in component:
                cluster_assignments[node_id] = idx

            # Define suspicious clusters: size >= 3 and average risk score >= 50
            if len(component) >= 3 and avg_risk >= 50:
                suspicious_clusters.append({
                    "cluster_id": idx,
                    "nodes": component,
                    "avg_risk_score": round(avg_risk, 2),
                    "nodes_count": len(component)
                })

        # Find high centrality nodes: Top 10% highest betweenness, or PageRank > threshold
        centrality_nodes_list = sorted(
            G.nodes,
            key=lambda n: (betweenness_scores.get(n, 0) * 0.5 + pagerank_scores.get(n, 0) * 0.5),
            reverse=True
        )
        
        # Select top nodes as high centrality
        top_centrality_threshold = max(3, int(len(G.nodes) * 0.08))
        high_centrality_set = set(centrality_nodes_list[:top_centrality_threshold])

        # 6. Generate Coordinates using Grouped Circular Layout
        pos = FraudNetworkService._compute_grouped_layout(wccs)

        # Format React Flow Nodes
        react_flow_nodes = []
        for node_id in G.nodes:
            node_attrs = G.nodes[node_id]
            x_coord = pos[node_id][0]
            y_coord = pos[node_id][1]

            react_flow_nodes.append({
                "id": node_id,
                "type": "account",
                "position": {"x": x_coord, "y": y_coord},
                "data": {
                    "id": node_id,
                    "label": node_attrs.get("label", ""),
                    "bank": node_attrs.get("bank", ""),
                    "balance": float(node_attrs.get("balance", 0.0)),
                    "riskScore": int(node_attrs.get("risk_score", 0)),
                    "designation": node_attrs.get("type", "Standard"),
                    "pagerank": float(round(pagerank_scores.get(node_id, 0.0), 5)),
                    "betweenness": float(round(betweenness_scores.get(node_id, 0.0), 5)),
                    "clusterId": cluster_assignments.get(node_id, -1),
                    "isHighCentrality": node_id in high_centrality_set,
                    "isInRing": node_id in nodes_in_rings
                }
            })

        # Format React Flow Edges
        react_flow_edges = []
        for u, v, edge_attrs in G.edges(data=True):
            risk = edge_attrs.get("risk_score", 0)
            amount = edge_attrs.get("amount", 0.0)
            edge_id = f"edge-{edge_attrs.get('id', '')}"

            # Check if this edge links nodes within a strongly connected cycle (ring)
            is_ring_edge = u in nodes_in_rings and v in nodes_in_rings

            # Determine colors: Red for critical risk, Orange for susp, Blue/Green for safe
            stroke_color = "#3b82f6" # default blue
            stroke_width = 1.5
            animated = False

            if risk >= 80 or is_ring_edge:
                stroke_color = "#f43f5e" # cyber-rose red
                stroke_width = 2.5
                animated = True
            elif risk >= 50:
                stroke_color = "#f59e0b" # cyber-amber orange
                stroke_width = 2.0
                animated = True

            react_flow_edges.append({
                "id": edge_id,
                "source": u,
                "target": v,
                "label": f"${amount:,.2f}",
                "animated": animated,
                "style": {
                    "stroke": stroke_color,
                    "strokeWidth": stroke_width
                }
            })

        # 7. Collect High Centrality telemetries for metadata summary
        high_centrality_meta = []
        for node_id in high_centrality_set:
            acc_info = acc_dict.get(node_id)
            if acc_info:
                high_centrality_meta.append({
                    "id": node_id,
                    "label": acc_info.label,
                    "risk_score": acc_info.risk_score,
                    "pagerank": float(round(pagerank_scores.get(node_id, 0.0), 5)),
                    "betweenness": float(round(betweenness_scores.get(node_id, 0.0), 5))
                })

        # Format strongly connected components summary details
        fraud_rings_meta = []
        for idx, ring in enumerate(sccs):
            ring_accounts = [acc_dict[nid] for nid in ring if nid in acc_dict]
            avg_ring_risk = sum(a.risk_score for a in ring_accounts) / len(ring_accounts) if ring_accounts else 0
            fraud_rings_meta.append({
                "ring_id": idx,
                "nodes": ring,
                "avg_risk_score": round(avg_ring_risk, 2),
                "nodes_count": len(ring)
            })

        metadata = {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "fraud_rings_count": len(sccs),
            "suspicious_clusters_count": len(suspicious_clusters),
            "high_centrality_nodes_count": len(high_centrality_meta),
            "high_centrality_nodes": high_centrality_meta,
            "fraud_rings": fraud_rings_meta,
            "suspicious_clusters": suspicious_clusters
        }

        return {
            "nodes": react_flow_nodes,
            "edges": react_flow_edges,
            "metadata": metadata
        }
