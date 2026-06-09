'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  NodeProps,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { formatCurrency, formatRiskScore } from '@/lib/utils';
import { 
  Network, 
  User, 
  Smartphone, 
  Globe, 
  ShieldAlert, 
  Plus, 
  HelpCircle,
  Building2,
  DollarSign,
  Maximize2,
  FolderOpen,
  Loader2,
  Ban,
  Activity
} from 'lucide-react';
import Link from 'next/link';

// ================= TYPES DEFINITIONS =================
interface ApiAccount {
  id: string;
  label: string;
  bank: string;
  balance: number;
  risk_score: number;
  type: string;
  x: number;
  y: number;
}

interface ApiTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  receiver_bank: string;
  amount: number;
  type: string;
  risk_score: number;
  status: string;
  flags: string[];
  geo_ip: string;
  location: string;
  device: string;
}

interface NodeDetailData {
  id: string;
  type: 'account' | 'device' | 'ip';
  label: string;
  bank?: string;
  balance?: number;
  riskScore?: number;
  designation?: string;
  deviceSignature?: string;
  ipAddress?: string;
  country?: string;
  connectionsCount?: number;
}

// ================= CUSTOM NODE COMPONENTS =================

// 1. Account Node
const AccountNodeCustom = ({ data }: NodeProps) => {
  const risk = formatRiskScore(data.riskScore || 0);
  
  // Dynamic border color depending on risk
  let borderGlow = 'border-cyber-emerald/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
  if (data.riskScore >= 80) {
    borderGlow = 'border-cyber-rose/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
  } else if (data.riskScore >= 50) {
    borderGlow = 'border-cyber-amber/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
  }

  return (
    <div className={`glass-panel p-3.5 rounded-lg border w-48 text-left relative bg-zinc-950/90 text-zinc-100 ${borderGlow}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className="flex justify-between items-start mb-1.5">
        <span className="font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Account</span>
        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border uppercase ${risk.color} ${risk.bg} ${risk.border}`}>
          {data.riskScore}%
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-cyber-cyan">
          <User className="h-4 w-4" />
        </div>
        <div className="truncate">
          <h4 className="font-bold text-xs text-zinc-250 truncate">{data.label}</h4>
          <span className="font-mono text-[9px] text-zinc-400 block truncate">{data.id}</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// 2. Device Node
const DeviceNodeCustom = ({ data }: NodeProps) => {
  return (
    <div className="glass-panel p-3 rounded-lg border border-purple-800/40 shadow-[0_0_15px_rgba(168,85,247,0.08)] w-48 text-left bg-zinc-950/90 text-zinc-100">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <span className="font-mono text-[9px] text-purple-400 font-bold uppercase tracking-wider block mb-1.5">Device signature</span>
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-purple-400">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="truncate">
          <h4 className="font-bold text-xs text-zinc-250 truncate">{data.label}</h4>
          <span className="text-[9px] text-zinc-500 block truncate">Shared Device Identifier</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// 3. IP Node
const IpNodeCustom = ({ data }: NodeProps) => {
  return (
    <div className="glass-panel p-3 rounded-lg border border-sky-800/40 shadow-[0_0_15px_rgba(56,189,248,0.08)] w-48 text-left bg-zinc-950/90 text-zinc-100">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <span className="font-mono text-[9px] text-sky-400 font-bold uppercase tracking-wider block mb-1.5">IP Node</span>
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-sky-400">
          <Globe className="h-4 w-4" />
        </div>
        <div className="truncate">
          <h4 className="font-bold text-xs font-mono text-zinc-250 truncate">{data.label}</h4>
          <span className="text-[9px] text-zinc-500 block truncate">{data.country || 'Jurisdiction Location'}</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Map React Flow node types to components
const nodeTypes = {
  account: AccountNodeCustom,
  device: DeviceNodeCustom,
  ip: IpNodeCustom
};

export default function MuleNetworksPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // API raw collections
  const [rawAccounts, setRawAccounts] = useState<ApiAccount[]>([]);
  const [rawTransactions, setRawTransactions] = useState<ApiTransaction[]>([]);
  
  // Triage state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector panel state
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<NodeDetailData | null>(null);

  // Set of already expanded accounts to prevent re-expanding redundantly
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  // 1. Initial Load APIs
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [accRes, txRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/accounts`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/transactions`)
        ]);
        
        if (!accRes.ok || !txRes.ok) {
          throw new Error("Failed to fetch graph data collections");
        }
        
        const accountsData: ApiAccount[] = await accRes.json();
        const transactionsData: ApiTransaction[] = await txRes.json();
        
        setRawAccounts(accountsData);
        setRawTransactions(transactionsData);
        setError(null);
        
        // Find a Mule Hub to seed the canvas with
        const initialHub = accountsData.find(a => a.type === "Mule Hub") || accountsData[0];
        if (initialHub) {
          initializeGraphForAccount(initialHub.id, accountsData, transactionsData);
        }
      } catch (err: any) {
        console.error(err);
        setError("API Error: Ensure the FastAPI backend is running on http://localhost:8000.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Initialize Canvas for selected account
  const initializeGraphForAccount = (accId: string, accountsList: ApiAccount[], transactionsList: ApiTransaction[]) => {
    const accountInfo = accountsList.find(a => a.id === accId);
    if (!accountInfo) return;

    // Reset expanded set
    const expandedSet = new Set<string>([accId]);
    setExpandedAccounts(expandedSet);

    // Initial Node: selected account placed centrally
    const rootNode: Node = {
      id: accId,
      type: 'account',
      position: { x: 400, y: 200 },
      data: { 
        id: accountInfo.id,
        label: accountInfo.label,
        riskScore: accountInfo.risk_score
      }
    };

    // Build details for inspector
    setSelectedNodeDetails({
      id: accountInfo.id,
      type: 'account',
      label: accountInfo.label,
      bank: accountInfo.bank,
      balance: accountInfo.balance,
      riskScore: accountInfo.risk_score,
      designation: accountInfo.type,
      connectionsCount: 0
    });

    const newNodes = [rootNode];
    const newEdges: Edge[] = [];

    // Find direct connections of the root account
    const directTxns = transactionsList.filter(t => t.sender_id === accId || t.receiver_id === accId);
    
    // Track unique entities to avoid duplicate nodes
    const foundEntities = new Set<string>([accId]);
    const radialElements: { type: 'account' | 'device' | 'ip'; id: string; label: string; extra?: string }[] = [];

    directTxns.forEach(tx => {
      // Neighboring accounts
      const partnerId = tx.sender_id === accId ? tx.receiver_id : tx.sender_id;
      const partnerAcc = accountsList.find(a => a.id === partnerId);
      if (partnerAcc && !foundEntities.has(partnerId)) {
        foundEntities.add(partnerId);
        radialElements.push({ type: 'account', id: partnerId, label: partnerAcc.label });
      }

      // Associated devices
      if (tx.device && tx.device.trim() && !foundEntities.has(tx.device)) {
        foundEntities.add(tx.device);
        radialElements.push({ type: 'device', id: tx.device, label: tx.device });
      }

      // Associated IPs
      if (tx.geo_ip && tx.geo_ip.trim() && !foundEntities.has(tx.geo_ip)) {
        foundEntities.add(tx.geo_ip);
        radialElements.push({ type: 'ip', id: tx.geo_ip, label: tx.geo_ip, extra: tx.location });
      }
    });

    // Radial layout spacing around root
    const radius = 220;
    const total = radialElements.length;
    
    radialElements.forEach((el, i) => {
      const angle = (i * 2 * Math.PI) / total;
      const posX = 400 + Math.cos(angle) * radius;
      const posY = 200 + Math.sin(angle) * radius;

      // Create Node
      if (el.type === 'account') {
        const pAcc = accountsList.find(a => a.id === el.id);
        newNodes.push({
          id: el.id,
          type: 'account',
          position: { x: posX, y: posY },
          data: { id: el.id, label: el.label, riskScore: pAcc?.risk_score || 0 }
        });
      } else if (el.type === 'device') {
        newNodes.push({
          id: el.id,
          type: 'device',
          position: { x: posX, y: posY },
          data: { label: el.label }
        });
      } else {
        // IP
        newNodes.push({
          id: el.id,
          type: 'ip',
          position: { x: posX, y: posY },
          data: { label: el.label, country: el.extra }
        });
      }

      // Create Edges
      if (el.type === 'account') {
        // Transaction edge
        // Find matching transactions to draw amount direction label
        const txMatch = directTxns.find(t => (t.sender_id === accId && t.receiver_id === el.id) || (t.sender_id === el.id && t.receiver_id === accId));
        if (txMatch) {
          const isOutflow = txMatch.sender_id === accId;
          newEdges.push({
            id: `edge-${txMatch.id}`,
            source: txMatch.sender_id,
            target: txMatch.receiver_id,
            label: formatCurrency(txMatch.amount),
            style: { stroke: txMatch.risk_score >= 80 ? '#f43f5e' : '#3b82f6', strokeWidth: 2 },
            animated: txMatch.risk_score >= 50
          });
        }
      } else if (el.type === 'device') {
        newEdges.push({
          id: `edge-dev-${accId}-${el.id}`,
          source: accId,
          target: el.id,
          style: { stroke: '#a855f7', strokeDasharray: '5,5', strokeWidth: 1.5 },
          animated: true
        });
      } else {
        // IP
        newEdges.push({
          id: `edge-ip-${accId}-${el.id}`,
          source: accId,
          target: el.id,
          style: { stroke: '#38bdf8', strokeDasharray: '5,5', strokeWidth: 1.5 },
          animated: true
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // 3. Dynamic Node Expansion Algorithm
  const expandNodeNeighbors = useCallback((targetId: string) => {
    // Only expand account nodes
    const accInfo = rawAccounts.find(a => a.id === targetId);
    if (!accInfo) return;

    if (expandedAccounts.has(targetId)) {
      // Node already expanded
      return;
    }

    setExpandedAccounts(prev => {
      const updated = new Set(prev);
      updated.add(targetId);
      return updated;
    });

    // Find parent node coordinates to arrange expanded neighbors radially around it
    const parentNode = nodes.find(n => n.id === targetId);
    const parentX = parentNode?.position.x || 400;
    const parentY = parentNode?.position.y || 200;

    const childTxns = rawTransactions.filter(t => t.sender_id === targetId || t.receiver_id === targetId);
    
    const currentNodesMap = new Map(nodes.map(n => [n.id, n]));
    const currentEdgesSet = new Set(edges.map(e => e.id));

    const nodesToAddMap = new Map<string, { type: 'account' | 'device' | 'ip'; id: string; label: string; extra?: string }>();
    const edgesToAdd: Edge[] = [];

    childTxns.forEach(tx => {
      // 1. Account partner
      const partnerId = tx.sender_id === targetId ? tx.receiver_id : tx.sender_id;
      const partnerAcc = rawAccounts.find(a => a.id === partnerId);
      if (partnerAcc) {
        if (!currentNodesMap.has(partnerId) && !nodesToAddMap.has(partnerId)) {
          nodesToAddMap.set(partnerId, { type: 'account', id: partnerId, label: partnerAcc.label });
        }
        
        // Transaction edge
        const edgeId = `edge-${tx.id}`;
        if (!currentEdgesSet.has(edgeId)) {
          edgesToAdd.push({
            id: edgeId,
            source: tx.sender_id,
            target: tx.receiver_id,
            label: formatCurrency(tx.amount),
            style: { stroke: tx.risk_score >= 80 ? '#f43f5e' : '#3b82f6', strokeWidth: 2 },
            animated: tx.risk_score >= 50
          });
          currentEdgesSet.add(edgeId);
        }
      }

      // 2. Device
      if (tx.device && tx.device.trim()) {
        const deviceId = tx.device;
        if (!currentNodesMap.has(deviceId) && !nodesToAddMap.has(deviceId)) {
          nodesToAddMap.set(deviceId, { type: 'device', id: deviceId, label: deviceId });
        }

        // Device link edge
        const edgeId = `edge-dev-${targetId}-${deviceId}`;
        if (!currentEdgesSet.has(edgeId)) {
          edgesToAdd.push({
            id: edgeId,
            source: targetId,
            target: deviceId,
            style: { stroke: '#a855f7', strokeDasharray: '5,5', strokeWidth: 1.5 },
            animated: true
          });
          currentEdgesSet.add(edgeId);
        }
      }

      // 3. IP
      if (tx.geo_ip && tx.geo_ip.trim()) {
        const ipId = tx.geo_ip;
        if (!currentNodesMap.has(ipId) && !nodesToAddMap.has(ipId)) {
          nodesToAddMap.set(ipId, { type: 'ip', id: ipId, label: ipId, extra: tx.location });
        }

        // IP link edge
        const edgeId = `edge-ip-${targetId}-${ipId}`;
        if (!currentEdgesSet.has(edgeId)) {
          edgesToAdd.push({
            id: edgeId,
            source: targetId,
            target: ipId,
            style: { stroke: '#38bdf8', strokeDasharray: '5,5', strokeWidth: 1.5 },
            animated: true
          });
          currentEdgesSet.add(edgeId);
        }
      }
    });

    if (nodesToAddMap.size === 0 && edgesToAdd.length === 0) {
      alert("No additional connections found for this account.");
      return;
    }

    const newNodesList = [...nodes];
    const newEdgesList = [...edges, ...edgesToAdd];

    const nodesToAddList = Array.from(nodesToAddMap.values());
    const radius = 180;
    const total = nodesToAddList.length;

    nodesToAddList.forEach((el, i) => {
      const angle = (i * 2 * Math.PI) / total;
      const posX = parentX + Math.cos(angle) * radius;
      const posY = parentY + Math.sin(angle) * radius;

      if (el.type === 'account') {
        const pAcc = rawAccounts.find(a => a.id === el.id);
        newNodesList.push({
          id: el.id,
          type: 'account',
          position: { x: posX, y: posY },
          data: { id: el.id, label: el.label, riskScore: pAcc?.risk_score || 0 }
        });
      } else if (el.type === 'device') {
        newNodesList.push({
          id: el.id,
          type: 'device',
          position: { x: posX, y: posY },
          data: { label: el.label }
        });
      } else {
        newNodesList.push({
          id: el.id,
          type: 'ip',
          position: { x: posX, y: posY },
          data: { label: el.label, country: el.extra }
        });
      }
    });

    setNodes(newNodesList);
    setEdges(newEdgesList);

    setSelectedNodeDetails(prev => {
      if (prev && prev.id === targetId) {
        return { ...prev, connectionsCount: (prev.connectionsCount || 0) + nodesToAddList.length + edgesToAdd.length };
      }
      return prev;
    });

  }, [nodes, edges, rawAccounts, rawTransactions, expandedAccounts, setNodes, setEdges]);

  // 4. Click node handler to inspect details
  const onNodeClick = (_: any, node: Node) => {
    if (node.type === 'account') {
      const acc = rawAccounts.find(a => a.id === node.id);
      if (acc) {
        // Find total linked elements in rawTransactions
        const linksCount = rawTransactions.filter(t => t.sender_id === acc.id || t.receiver_id === acc.id).length;
        setSelectedNodeDetails({
          id: acc.id,
          type: 'account',
          label: acc.label,
          bank: acc.bank,
          balance: acc.balance,
          riskScore: acc.risk_score,
          designation: acc.type,
          connectionsCount: linksCount
        });
      }
    } else if (node.type === 'device') {
      const devTxns = rawTransactions.filter(t => t.device === node.id);
      const uniqueAccounts = new Set(devTxns.map(t => t.sender_id));
      setSelectedNodeDetails({
        id: node.id,
        type: 'device',
        label: node.id,
        deviceSignature: node.id,
        connectionsCount: uniqueAccounts.size
      });
    } else if (node.type === 'ip') {
      const ipTxns = rawTransactions.filter(t => t.geo_ip === node.id);
      const uniqueAccounts = new Set(ipTxns.map(t => t.sender_id));
      const loc = ipTxns[0]?.location || 'Unknown location';
      setSelectedNodeDetails({
        id: node.id,
        type: 'ip',
        label: node.id,
        ipAddress: node.id,
        country: loc,
        connectionsCount: uniqueAccounts.size
      });
    }
  };

  // Find all hubs list for selection index
  const muleHubs = rawAccounts.filter(a => a.type === "Mule Hub" || a.risk_score >= 80);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan">
          Mule Ring Graph Visualizer
        </h1>
        <p className="text-sm text-zinc-400">
          Trace structural connections between accounts, shared physical devices, and networks IPs interactively.
        </p>
      </div>

      {/* Connection banner errors */}
      {error && (
        <div className="p-4 rounded-lg bg-cyber-rose/15 border border-cyber-rose/35 text-xs text-cyber-rose flex items-center gap-2 animate-pulse">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch flex-1 min-h-[500px]">
        
        {/* Left/Canvas Columns (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          
          {/* Hub Selector bar */}
          <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Activity className="h-4 w-4 text-cyber-cyan animate-pulse" />
              <span>Select Mule Hub to Plot:</span>
              <select
                onChange={(e) => initializeGraphForAccount(e.target.value, rawAccounts, rawTransactions)}
                className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
              >
                {muleHubs.map(hub => (
                  <option key={hub.id} value={hub.id}>
                    {hub.id} - {hub.label} (Score: {hub.risk_score})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-[10px] text-zinc-500 font-mono">
              DOUBLE-CLICK ACCOUNT NODES ON CANVAS TO EXPAND ASSOCIATIONS
            </div>
          </GlassCard>

          {/* React Flow Editor */}
          <GlassCard className="p-0 overflow-hidden flex-1 relative border border-zinc-800/80 min-h-[450px]">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-sm z-10">
                <Loader2 className="h-10 w-10 text-cyber-cyan animate-spin mb-2" />
                <span className="text-xs text-zinc-400 font-mono">Loading dynamic graphs...</span>
              </div>
            )}
            
            <div className="w-full h-full min-h-[450px] relative">
              {/* Floating Legend Overlay */}
              <div className="absolute top-4 left-4 z-10 p-3 rounded-lg border border-zinc-850 bg-zinc-950/90 backdrop-blur-md text-[10px] text-zinc-400 space-y-2.5 max-w-[200px] shadow-lg pointer-events-none">
                <div className="font-bold text-zinc-350 tracking-wider uppercase border-b border-zinc-900 pb-1">
                  Graph Legend
                </div>
                
                {/* Node categories */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-zinc-500 uppercase tracking-wider text-[8px]">Node Types</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-cyber-cyan bg-cyber-cyan/10 flex items-center justify-center text-[7px] text-cyber-cyan font-bold">A</span>
                    <span>Account Node</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-purple-500 bg-purple-500/10 flex items-center justify-center text-[7px] text-purple-400 font-bold">D</span>
                    <span>Device Identifier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-sky-500 bg-sky-500/10 flex items-center justify-center text-[7px] text-sky-450 font-bold">IP</span>
                    <span>IP Location Node</span>
                  </div>
                </div>

                {/* Threat Levels */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-zinc-500 uppercase tracking-wider text-[8px]">Account Risk Levels</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-cyber-emerald bg-cyber-emerald/10 block shrink-0"></span>
                    <span className="text-cyber-emerald font-semibold">Safe (&lt;50%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-cyber-amber bg-cyber-amber/10 block shrink-0"></span>
                    <span className="text-cyber-amber font-semibold">Suspicious (50-79%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-cyber-rose bg-cyber-rose/10 block shrink-0"></span>
                    <span className="text-cyber-rose font-semibold">Mule Hub (≥80%)</span>
                  </div>
                </div>

                {/* Relationship categories */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-zinc-500 uppercase tracking-wider text-[8px]">Relationships</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-[2px] bg-cyber-blue block shrink-0"></span>
                    <span>Standard Transaction</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-[2px] bg-cyber-rose block shrink-0"></span>
                    <span>High-Risk Transaction</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-[1px] border-t border-dashed border-purple-500 block shrink-0"></span>
                    <span>Shared Device Link</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-[1px] border-t border-dashed border-sky-500 block shrink-0"></span>
                    <span>Shared IP Link</span>
                  </div>
                </div>
              </div>

              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={(_, node) => expandNodeNeighbors(node.id)}
                nodeTypes={nodeTypes}
                fitView
                className="bg-zinc-950/25"
              >
                <Background color="#18181b" gap={16} size={1.5} variant={BackgroundVariant.Dots} />
                <Controls className="bg-zinc-900 border border-zinc-800 text-zinc-200 fill-zinc-200" />
              </ReactFlow>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Node Details Inspector (1/3 width) */}
        <div>
          {selectedNodeDetails ? (
            <GlassCard 
              glowColor={
                selectedNodeDetails.type === 'account' 
                  ? ((selectedNodeDetails.riskScore || 0) >= 80 ? 'rose' : (selectedNodeDetails.riskScore || 0) >= 50 ? 'amber' : 'cyan') 
                  : 'none'
              } 
              className="space-y-5 sticky top-20 h-fit"
            >
              <GlassCardHeader 
                title={`${selectedNodeDetails.type.toUpperCase()} INSPECTOR`} 
                subtitle={`Entity hash record: ${selectedNodeDetails.id}`} 
              />

              {/* Entity Risk Metric if Account */}
              {selectedNodeDetails.type === 'account' && (
                <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-950/40">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono">ACCOUNT THREAT LEVEL</span>
                    <h3 className="text-2xl font-extrabold mt-0.5 font-mono text-zinc-200">
                      {selectedNodeDetails.riskScore}%
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                    formatRiskScore(selectedNodeDetails.riskScore || 0).color
                  } ${formatRiskScore(selectedNodeDetails.riskScore || 0).bg} ${formatRiskScore(selectedNodeDetails.riskScore || 0).border}`}>
                    {formatRiskScore(selectedNodeDetails.riskScore || 0).text}
                  </span>
                </div>
              )}

              {/* Profile Details */}
              <div className="space-y-3.5 text-xs text-zinc-400">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span>Owner Identifier:</span>
                  <strong className="text-zinc-200">{selectedNodeDetails.label}</strong>
                </div>

                {selectedNodeDetails.type === 'account' && (
                  <>
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span>Holding Institution:</span>
                      <strong className="text-zinc-350">{selectedNodeDetails.bank}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span>Ledger Balance:</span>
                      <strong className="text-zinc-250 font-mono">{formatCurrency(selectedNodeDetails.balance || 0)}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span>Mule Ring Role:</span>
                      <strong className="text-cyber-cyan font-bold">{selectedNodeDetails.designation}</strong>
                    </div>
                  </>
                )}

                {selectedNodeDetails.type === 'ip' && (
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span>IP Location Check:</span>
                    <strong className="text-zinc-200">{selectedNodeDetails.country || 'N/A'}</strong>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Linked Associations:</span>
                  <strong className="text-cyber-cyan font-mono">{selectedNodeDetails.connectionsCount} nodes</strong>
                </div>
              </div>

              {/* Action overriding options */}
              <div className="space-y-2.5 border-t border-zinc-900 pt-4 mt-4">
                {selectedNodeDetails.type === 'account' && (
                  <>
                    {/* Expand Node trigger */}
                    {!expandedAccounts.has(selectedNodeDetails.id) && (
                      <button
                        onClick={() => expandNodeNeighbors(selectedNodeDetails.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/35 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer"
                      >
                        <Maximize2 className="h-4 w-4" />
                        Expand Neighborhood Connections
                      </button>
                    )}
                    
                    <button
                      onClick={() => alert(`Suspended account ${selectedNodeDetails.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose hover:bg-cyber-rose/20 transition-all duration-150"
                    >
                      <Ban className="h-4 w-4" />
                      Suspend & Hold Assets
                    </button>
                  </>
                )}

                {selectedNodeDetails.type === 'ip' && (
                  <button
                    onClick={() => alert(`Blacklisting IP address ${selectedNodeDetails.ipAddress}`)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose hover:bg-cyber-rose/20 transition-all duration-150"
                  >
                    <Ban className="h-4 w-4" />
                    Blacklist Network IP Endpoint
                  </button>
                )}

                <Link
                  href={`/transactions?search=${encodeURIComponent(selectedNodeDetails.id)}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all duration-150"
                >
                  <FolderOpen className="h-4 w-4 text-cyber-cyan" />
                  Filter Transactions Logs
                </Link>
              </div>

            </GlassCard>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-900 rounded-lg">
              <Network className="h-10 w-10 text-zinc-700 mb-2" />
              <p className="font-semibold text-sm">Select node</p>
              <p className="text-xs">Click any node on the React Flow canvas to inspect profiling data.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
