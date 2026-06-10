'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { formatCurrency, formatRiskScore } from '@/lib/utils';
import { 
  Shuffle, 
  Search, 
  ArrowRight,
  AlertTriangle,
  Building, 
  Clock, 
  TrendingDown, 
  HelpCircle,
  Play,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface SankeyNode {
  id: string;
  label: string;
  bank: string;
  balance: number;
  risk_score: number;
  type: string;
  hop: number;
}

interface SankeyLink {
  id: string;
  source: string;
  target: string;
  receiver_bank: string;
  amount: number;
  timestamp: string;
  risk_score: number;
  type: string;
  status: string;
}

interface TraceData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const SUGGESTED_ACCOUNTS = [
  { id: 'ACT-SAFE-12', label: 'Linda Davidson', bank: 'Caribbean Cayman Bank', desc: 'Traces through Mule Ring 1 & 8' },
  { id: 'ACT-SAFE-33', label: 'Amanda Garcia', bank: 'Offshore Finance', desc: 'Traces through Mule Ring 1 & 2' },
  { id: 'ACT-SAFE-10', label: 'Sarah Garcia', bank: 'NeoBank Tech', desc: 'Traces through Mule Ring 1' },
  { id: 'ACT-SAFE-35', label: 'Robert Gonzalez', bank: 'FraudShield AI Bank', desc: 'Traces through Mule Ring 10' }
];

export default function MoneyFlowPage() {
  const [targetAccount, setTargetAccount] = useState('ACT-SAFE-12');
  const [isTracing, setIsTracing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [suspiciousOnly, setSuspiciousOnly] = useState(true);

  // Hover states for interactive visualization
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    type: 'node' | 'link';
    details: Record<string, string | number>;
  } | null>(null);

  const fetchTrace = async (accountId: string) => {
    setIsTracing(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/money-flow/${accountId}?depth=3`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Account "${accountId}" was not found in the database.`);
        }
        throw new Error(`Failed to trace account. Server returned: ${res.statusText}`);
      }
      const data = await res.json();
      setTraceData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during tracing.');
      setTraceData(null);
    } finally {
      setIsTracing(false);
    }
  };

  useEffect(() => {
    fetchTrace('ACT-SAFE-12');
  }, []);

  const triggerTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAccount.trim()) {
      fetchTrace(targetAccount.trim());
    }
  };

  const getHopColor = (hop: number) => {
    switch (hop) {
      case 0: return '#06b6d4'; // Victim (Cyber Cyan)
      case 1: return '#fbbf24'; // Smurf / Mule 1 (Amber)
      case 2: return '#f43f5e'; // Mule Hub / Mule 2 (Rose)
      default: return '#a21caf'; // Integrator / Exit / Mule 3 (Purple)
    }
  };

  const getHopName = (hop: number, type: string) => {
    if (hop === 0) return 'Victim Account';
    if (hop === 1) return `Mule Layer 1 (${type})`;
    if (hop === 2) return `Mule Layer 2 (${type})`;
    return `Exit Terminal (${type})`;
  };

  // Helper to filter nodes and links to only include suspicious paths
  const getProcessedData = () => {
    if (!traceData) return { nodes: [], links: [] };
    if (!suspiciousOnly) return traceData;

    const { nodes: rawNodes, links: rawLinks } = traceData;

    // A node is suspicious if:
    // - it's type is Mule Hub, Smurf, or Integrator
    // - it has risk score >= 35
    // - it is the victim root (hop === 0)
    const suspiciousNodeIds = new Set<string>();
    rawNodes.forEach(n => {
      if (n.type === 'Mule Hub' || n.type === 'Smurf' || n.type === 'Integrator' || n.risk_score >= 35 || n.hop === 0) {
        suspiciousNodeIds.add(n.id);
      }
    });

    // Backward reachability check to trace ancestor path of suspicious nodes
    const reachableFromSuspicious = new Set<string>(suspiciousNodeIds);
    let changed = true;
    while (changed) {
      changed = false;
      rawLinks.forEach(link => {
        if (reachableFromSuspicious.has(link.target) && !reachableFromSuspicious.has(link.source)) {
          reachableFromSuspicious.add(link.source);
          changed = true;
        }
      });
    }

    const filteredLinks = rawLinks.filter(link => 
      reachableFromSuspicious.has(link.source) && reachableFromSuspicious.has(link.target)
    );

    const connectedNodeIds = new Set<string>();
    filteredLinks.forEach(link => {
      connectedNodeIds.add(link.source);
      connectedNodeIds.add(link.target);
    });

    // Ensure victim is kept
    const victim = rawNodes.find(n => n.hop === 0);
    if (victim) {
      connectedNodeIds.add(victim.id);
    }

    const filteredNodes = rawNodes.filter(n => connectedNodeIds.has(n.id));

    return { nodes: filteredNodes, links: filteredLinks };
  };

  const processedData = getProcessedData();

  // Metric computations for right panel
  const getTraceMetrics = () => {
    if (!traceData) return { suspiciousHops: 0, exitVolume: 0, riskFactor: 'Low' };
    const { nodes, links } = traceData;
    
    const suspiciousCount = nodes.filter(n => n.type !== 'Standard' || n.risk_score >= 50).length;
    const exitNodeId = nodes.find(n => n.type === 'Integrator')?.id;
    const exitVolume = links
      .filter(l => l.target === exitNodeId || nodes.find(n => n.id === l.target)?.type === 'Integrator')
      .reduce((sum, l) => sum + l.amount, 0);

    const maxRisk = Math.max(...nodes.map(n => n.risk_score), 0);
    let riskFactor = 'Low';
    if (maxRisk >= 80) riskFactor = 'Critical';
    else if (maxRisk >= 50) riskFactor = 'High';
    else if (maxRisk >= 25) riskFactor = 'Medium';

    return {
      suspiciousHops: suspiciousCount,
      exitVolume,
      riskFactor
    };
  };

  const metrics = getTraceMetrics();

  // Layout Constants for Sankey SVG rendering
  const width = 850;
  const height = 500;
  const paddingX = 60;
  const paddingY = 50;
  const nodeWidth = 24;
  const nodePadding = 24;

  // Layer mapping
  const layers: Record<number, SankeyNode[]> = {};
  processedData.nodes.forEach(node => {
    const layerIdx = node.hop ?? 3;
    if (!layers[layerIdx]) layers[layerIdx] = [];
    layers[layerIdx].push(node);
  });

  const layerIds = Object.keys(layers).map(Number).sort((a, b) => a - b);
  const numLayers = layerIds.length;
  const colWidth = numLayers > 1 ? (width - 2 * paddingX - nodeWidth) / (numLayers - 1) : 0;

  // Node sizes based on transaction flows
  const nodeValues: Record<string, number> = {};
  processedData.nodes.forEach(node => {
    const outFlow = processedData.links.filter(l => l.source === node.id).reduce((sum, l) => sum + l.amount, 0);
    const inFlow = processedData.links.filter(l => l.target === node.id).reduce((sum, l) => sum + l.amount, 0);
    nodeValues[node.id] = Math.max(inFlow, outFlow, 500); // min flow size value for spacing
  });

  // Scale layer heights dynamically
  const layerScales: Record<number, number> = {};
  layerIds.forEach(layerIdx => {
    const layerNodes = layers[layerIdx];
    const totalValue = layerNodes.reduce((sum, node) => sum + nodeValues[node.id], 0);
    const totalPadding = (layerNodes.length - 1) * nodePadding;
    const availableHeight = height - 2 * paddingY - totalPadding;
    layerScales[layerIdx] = totalValue > 0 ? availableHeight / totalValue : 0;
  });

  // Calculate coordinates
  const nodePositions: Record<string, { x: number; y: number; h: number }> = {};
  layerIds.forEach((layerIdx, colIdx) => {
    const layerNodes = layers[layerIdx];
    const x = paddingX + colIdx * colWidth;

    const totalNodeHeight = layerNodes.reduce(
      (sum, node) => sum + Math.max(30, nodeValues[node.id] * layerScales[layerIdx]), 
      0
    );
    const totalPadding = (layerNodes.length - 1) * nodePadding;
    const startY = paddingY + (height - 2 * paddingY - (totalNodeHeight + totalPadding)) / 2;

    let currentY = startY;
    layerNodes.forEach(node => {
      const h = Math.max(30, nodeValues[node.id] * layerScales[layerIdx]);
      nodePositions[node.id] = { x, y: currentY, h };
      currentY += h + nodePadding;
    });
  });

  // Generate Bezier curves and offsets for transaction links
  const sourceOffsets: Record<string, number> = {};
  const targetOffsets: Record<string, number> = {};

  const linksWithPaths = processedData.links.map(link => {
    const sourcePos = nodePositions[link.source];
    const targetPos = nodePositions[link.target];

    if (!sourcePos || !targetPos) return null;

    const sourceScale = sourcePos.h / nodeValues[link.source];
    const targetScale = targetPos.h / nodeValues[link.target];

    // Compute path height
    const linkH = Math.max(3, link.amount * Math.min(sourceScale, targetScale));

    const sOffset = sourceOffsets[link.source] ?? 0;
    const tOffset = targetOffsets[link.target] ?? 0;

    sourceOffsets[link.source] = sOffset + linkH;
    targetOffsets[link.target] = tOffset + linkH;

    const x0 = sourcePos.x + nodeWidth;
    const y0 = sourcePos.y + sOffset + linkH / 2;
    const x1 = targetPos.x;
    const y1 = targetPos.y + tOffset + linkH / 2;

    const cpX = (x0 + x1) / 2;
    const d = `M ${x0} ${y0} C ${cpX} ${y0}, ${cpX} ${y1}, ${x1} ${y1}`;

    return {
      ...link,
      d,
      strokeWidth: linkH,
      y0,
      y1
    };
  }).filter((link): link is NonNullable<typeof link> => link !== null);

  // Check if a node/link is highlighted or dimmed
  const getHighlightStatus = (item: { type: 'node' | 'link'; id: string; source?: string; target?: string }) => {
    if (!hoveredNodeId && !hoveredLinkId) return 'normal';

    if (hoveredNodeId) {
      if (item.type === 'node') {
        if (item.id === hoveredNodeId) return 'highlighted';
        // Node is highlighted if linked directly to the hovered node
        const isConnected = processedData.links.some(l => 
          (l.source === hoveredNodeId && l.target === item.id) || 
          (l.target === hoveredNodeId && l.source === item.id)
        );
        return isConnected ? 'highlighted' : 'dimmed';
      } else {
        // Link is highlighted if it starts or ends at the hovered node
        return (item.source === hoveredNodeId || item.target === hoveredNodeId) ? 'highlighted' : 'dimmed';
      }
    }

    if (hoveredLinkId) {
      if (item.type === 'link') {
        return item.id === hoveredLinkId ? 'highlighted' : 'dimmed';
      } else {
        // Node is highlighted if it is source or target of hovered link
        const targetLink = processedData.links.find(l => l.id === hoveredLinkId);
        return (targetLink && (targetLink.source === item.id || targetLink.target === item.id)) ? 'highlighted' : 'dimmed';
      }
    }

    return 'normal';
  };

  const handleMouseMove = (e: React.MouseEvent, type: 'node' | 'link', title: string, details: Record<string, string | number>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgEl = e.currentTarget.closest('svg');
    if (!svgEl) return;
    const svgRect = svgEl.getBoundingClientRect();

    setTooltip({
      x: rect.left - svgRect.left + rect.width / 2,
      y: rect.top - svgRect.top - 10,
      title,
      type,
      details
    });
  };

  const handleMouseLeave = () => {
    setHoveredNodeId(null);
    setHoveredLinkId(null);
    setTooltip(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan flex items-center gap-2">
          <Shield className="h-7 w-7 text-cyber-cyan" />
          Money Flow Tracing Engine
        </h1>
        <p className="text-sm text-zinc-400">
          Trace ledger routing paths downstream to audit transaction splits, layering structures, and offshore crypto exit points.
        </p>
      </div>

      {/* Input panel & suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-4 lg:col-span-2 flex flex-col justify-between">
          <form onSubmit={triggerTrace} className="flex flex-col md:flex-row gap-4 items-end justify-between">
            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Trace Start Account / Victim ID</label>
              <div className="relative w-full">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  placeholder="Enter Account ID (e.g. ACT-SAFE-12)..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pr-4 pl-9 text-sm text-zinc-200 placeholder-zinc-500 focus:border-cyber-cyan/50 focus:outline-none transition-all duration-150"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isTracing}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <Shuffle className={isTracing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {isTracing ? 'Tracing Asset Hops...' : 'Analyze Asset Path'}
            </button>
          </form>

          {/* Filtering options */}
          <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyber-cyan" />
              Showing chronological multi-hop money split path.
            </span>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px] font-mono">Suspicious Flows Only</span>
              <button
                onClick={() => setSuspiciousOnly(!suspiciousOnly)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  suspiciousOnly ? 'bg-cyber-cyan' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-100 shadow ring-0 transition duration-200 ease-in-out ${
                    suspiciousOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Suggestion list */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Suggested Victim Accounts</span>
            <span className="text-[11px] text-zinc-500 block leading-tight">Click on a compromise victim to load their flow tree from the database.</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {SUGGESTED_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setTargetAccount(acc.id);
                  fetchTrace(acc.id);
                }}
                className={`p-2 rounded border text-left transition-all duration-150 cursor-pointer hover:bg-zinc-900/40 hover:border-zinc-800 ${
                  targetAccount === acc.id 
                    ? 'border-cyber-cyan/50 bg-cyber-cyan/5 text-cyber-cyan' 
                    : 'border-zinc-900 bg-zinc-950/20 text-zinc-300'
                }`}
              >
                <span className="font-mono text-xs font-semibold block">{acc.id}</span>
                <span className="text-[10px] text-zinc-400 block truncate">{acc.label}</span>
                <span className="text-[9px] text-zinc-600 block leading-none truncate mt-0.5">{acc.desc}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Main visualization area */}
      {error && (
        <div className="p-5 rounded-lg border border-cyber-rose/30 bg-cyber-rose/5 text-cyber-rose flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Trace Operation Failed</h4>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {isTracing ? (
        <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-xl">
          <div className="h-12 w-12 rounded-full border-2 border-t-cyber-cyan border-r-cyber-cyan/25 border-b-cyber-cyan/10 border-l-cyber-cyan/25 animate-spin mb-4" />
          <p className="font-semibold text-sm text-zinc-300">Running Downstream Hop Traversal...</p>
          <p className="text-xs text-zinc-500 mt-1">Sorting transaction timestamps, computing balances, and isolating layers.</p>
        </div>
      ) : traceData && processedData.nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-xl text-center p-6">
          <Info className="h-10 w-10 text-cyber-amber mb-3" />
          <p className="font-semibold text-sm text-zinc-300">No suspicious flows detected</p>
          <p className="text-xs text-zinc-500 max-w-md mt-1">
            This account does not have any outgoing transaction paths leading to known mule accounts or suspicious nodes. Toggle off "Suspicious Flows Only" to view safe transactions.
          </p>
        </div>
      ) : traceData ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Sankey Canvas - 3/4 width */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="relative p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Asset Flow Diagram (Sankey)</h3>
                  <p className="text-xs text-zinc-500">Hover over nodes or curves to inspect money split paths.</p>
                </div>
                <div className="flex gap-4 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyber-cyan" />
                    <span>Victim</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>Mule 1 (Smurf)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Mule 2 (Hub)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-fuchsia-600" />
                    <span>Exit (Integrator)</span>
                  </div>
                </div>
              </div>

              {/* SVG Canvas */}
              <div className="relative w-full overflow-x-auto">
                <svg width={width} height={height} className="mx-auto block select-none overflow-visible">
                  <defs>
                    {/* Define gradients dynamically for links */}
                    {linksWithPaths.map(link => {
                      const sourceNode = processedData.nodes.find(n => n.id === link.source);
                      const targetNode = processedData.nodes.find(n => n.id === link.target);
                      const sColor = getHopColor(sourceNode?.hop ?? 3);
                      const tColor = getHopColor(targetNode?.hop ?? 3);
                      
                      const hStatus = getHighlightStatus({ type: 'link', id: link.id });
                      const opacity = hStatus === 'highlighted' ? 0.75 : hStatus === 'dimmed' ? 0.05 : 0.25;

                      return (
                        <linearGradient
                          key={`grad-${link.id}`}
                          id={`grad-${link.id}`}
                          gradientUnits="userSpaceOnUse"
                          x1={nodePositions[link.source].x + nodeWidth}
                          y1={link.y0}
                          x2={nodePositions[link.target].x}
                          y2={link.y1}
                        >
                          <stop offset="0%" stopColor={sColor} stopOpacity={opacity} />
                          <stop offset="100%" stopColor={tColor} stopOpacity={opacity} />
                        </linearGradient>
                      );
                    })}

                    {/* Node Gradients */}
                    <linearGradient id="grad-node-0" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <linearGradient id="grad-node-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="grad-node-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <linearGradient id="grad-node-3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                    <linearGradient id="grad-node-ext" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9ca3af" />
                      <stop offset="100%" stopColor="#4b5563" />
                    </linearGradient>
                  </defs>

                  {/* Render Links (Curves) */}
                  <g>
                    {linksWithPaths.map((link) => {
                      const hStatus = getHighlightStatus({ type: 'link', id: link.id });
                      const sourceNode = processedData.nodes.find(n => n.id === link.source);
                      const targetNode = processedData.nodes.find(n => n.id === link.target);

                      return (
                        <path
                          key={link.id}
                          d={link.d}
                          fill="none"
                          stroke={`url(#grad-${link.id})`}
                          strokeWidth={link.strokeWidth}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredLinkId(link.id)}
                          onMouseLeave={handleMouseLeave}
                          onMouseMove={(e) => handleMouseMove(e, 'link', link.id, {
                            'Sender ID': link.source,
                            'Sender Bank': sourceNode?.bank || 'Unknown',
                            'Receiver ID': link.target,
                            'Receiver Bank': targetNode?.bank || link.receiver_bank,
                            'Transfer Amount': formatCurrency(link.amount),
                            'Risk Score': `${link.risk_score} / 100`,
                            'Timestamp': link.timestamp,
                            'Route Status': link.status,
                            'Method': link.type
                          })}
                        />
                      );
                    })}
                  </g>

                  {/* Render Nodes (Vertical Bars) */}
                  <g>
                    {processedData.nodes.map((node) => {
                      const pos = nodePositions[node.id];
                      if (!pos) return null;

                      const hStatus = getHighlightStatus({ type: 'node', id: node.id });
                      const opacity = hStatus === 'highlighted' ? 1.0 : hStatus === 'dimmed' ? 0.25 : 0.9;
                      const isRoot = node.hop === 0;

                      // Map gradient URL
                      const gradUrl = node.type === 'External' ? 'url(#grad-node-ext)' : `url(#grad-node-${Math.min(node.hop, 3)})`;
                      const color = getHopColor(node.hop);

                      return (
                        <g 
                          key={node.id}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={handleMouseLeave}
                          onMouseMove={(e) => handleMouseMove(e, 'node', node.id, {
                            'Account Owner': node.label,
                            'Designation': getHopName(node.hop, node.type),
                            'Bank': node.bank,
                            'Risk Score': `${node.risk_score} / 100`,
                            'Vault Balance': formatCurrency(node.balance),
                            'Hop Level': `Hop ${node.hop}`
                          })}
                        >
                          {/* Outer neon border glow for hovered / victim nodes */}
                          {(hStatus === 'highlighted' || isRoot) && (
                            <rect
                              x={pos.x - 2}
                              y={pos.y - 2}
                              width={nodeWidth + 4}
                              height={pos.h + 4}
                              rx={4}
                              fill="none"
                              stroke={color}
                              strokeWidth={1.5}
                              opacity={0.6}
                              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                            />
                          )}

                          {/* Node Rectangle */}
                          <rect
                            x={pos.x}
                            y={pos.y}
                            width={nodeWidth}
                            height={pos.h}
                            rx={3}
                            fill={gradUrl}
                            opacity={opacity}
                          />

                          {/* Node Label Text */}
                          <text
                            x={pos.x + (node.hop === numLayers - 1 ? -12 : nodeWidth + 12)}
                            y={pos.y + pos.h / 2}
                            dy="0.35em"
                            textAnchor={node.hop === numLayers - 1 ? 'end' : 'start'}
                            className={`text-[10px] font-mono fill-zinc-300 font-semibold transition-all duration-150 ${
                              hStatus === 'highlighted' ? 'fill-zinc-100 scale-105 font-bold' : ''
                            }`}
                          >
                            {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                          </text>

                          {/* Node Account Sub-text */}
                          <text
                            x={pos.x + (node.hop === numLayers - 1 ? -12 : nodeWidth + 12)}
                            y={pos.y + pos.h / 2 + 12}
                            dy="0.35em"
                            textAnchor={node.hop === numLayers - 1 ? 'end' : 'start'}
                            className="text-[9px] fill-zinc-500 font-mono"
                          >
                            {node.id}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Floating Rich Tooltip */}
                {tooltip && (
                  <div 
                    className="absolute glass-panel p-3.5 rounded-lg border border-zinc-800 pointer-events-none z-40 text-xs shadow-2xl flex flex-col space-y-1.5 w-64 max-w-sm transition-all duration-75"
                    style={{ 
                      left: `${tooltip.x}px`, 
                      top: `${tooltip.y}px`, 
                      transform: 'translate(-50%, -100%)' 
                    }}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                      <span className="font-mono font-bold text-zinc-100 truncate">{tooltip.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        tooltip.type === 'node' ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/20' : 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20'
                      }`}>
                        {tooltip.type}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {Object.entries(tooltip.details).map(([key, value]) => {
                        const isRisk = key === 'Risk Score';
                        const isAmount = key === 'Transfer Amount';
                        
                        return (
                          <div key={key} className="flex justify-between items-center text-[10px] font-mono leading-tight">
                            <span className="text-zinc-500">{key}:</span>
                            <span className={`text-right font-medium truncate max-w-[150px] ${
                              isRisk && String(value).startsWith('8') || String(value).startsWith('9') || String(value).startsWith('10')
                                ? 'text-cyber-rose font-bold'
                                : isRisk && String(value).startsWith('5') || String(value).startsWith('6') || String(value).startsWith('7')
                                ? 'text-cyber-amber font-bold'
                                : isAmount
                                ? 'text-cyber-emerald font-bold'
                                : 'text-zinc-300'
                            }`}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Path Details and Metrics - 1/4 width */}
          <div className="space-y-6 lg:col-span-1">
            <GlassCard className="p-4">
              <GlassCardHeader title="Trace Telemetries" />
              
              <div className="space-y-4 text-xs mt-3">
                {/* Risk assessment */}
                <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 flex justify-between items-center">
                  <div>
                    <span className="text-zinc-500 block text-[9px] font-mono uppercase tracking-wider">Mule Threat Level</span>
                    <span className={`font-semibold text-sm ${
                      metrics.riskFactor === 'Critical' ? 'text-cyber-rose text-glow-rose' :
                      metrics.riskFactor === 'High' ? 'text-cyber-amber text-glow-amber' :
                      'text-cyber-emerald'
                    }`}>{metrics.riskFactor}</span>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${
                    metrics.riskFactor === 'Critical' ? 'text-cyber-rose' :
                    metrics.riskFactor === 'High' ? 'text-cyber-amber' :
                    'text-cyber-emerald'
                  }`} />
                </div>

                {/* Hops count */}
                <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 flex justify-between items-center">
                  <div>
                    <span className="text-zinc-500 block text-[9px] font-mono uppercase tracking-wider">Isolated Mule Accounts</span>
                    <span className="font-semibold text-zinc-200 text-sm">{metrics.suspiciousHops} nodes</span>
                  </div>
                  <Layers className="h-5 w-5 text-cyber-cyan" />
                </div>

                {/* Layering velocity */}
                <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 flex justify-between items-center">
                  <div>
                    <span className="text-zinc-500 block text-[9px] font-mono uppercase tracking-wider">Total Volume Outflow</span>
                    <span className="font-semibold text-cyber-rose text-sm font-mono">{formatCurrency(metrics.exitVolume)}</span>
                  </div>
                  <TrendingDown className="h-5 w-5 text-cyber-rose" />
                </div>

                {/* Integration Info */}
                <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 space-y-1">
                  <span className="text-zinc-500 block text-[9px] font-mono uppercase tracking-wider">Exit Integration Point</span>
                  <div className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-semibold text-zinc-300 font-mono text-[10px] truncate">
                      {processedData.nodes.find(n => n.type === 'Integrator')?.bank || 'Not Reached'}
                    </span>
                  </div>
                </div>

                {/* Dispatch freeze warning button */}
                <button
                  onClick={() => alert(`Freeze orders dispatched to the compliance desks of receiver banks: ${
                    Array.from(new Set(processedData.nodes.filter(n => n.hop > 0).map(n => n.bank))).join(', ')
                  }`)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/35 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer"
                >
                  <Play className="h-4 w-4" />
                  Freeze Downstream Funds
                </button>
              </div>
            </GlassCard>

            <GlassCard className="text-xs text-zinc-400 p-4 relative overflow-hidden">
              {/* Scanline decoration */}
              <div className="absolute top-0 right-0 h-16 w-16 bg-cyber-cyan/5 rounded-full blur-2xl" />
              <div className="flex gap-2.5 items-start">
                <Sparkles className="h-5 w-5 text-cyber-cyan shrink-0" />
                <p className="leading-normal">
                  Sankey curves dynamically map the split and consolidation of funds. The thickness of each curve represents the relative transaction amount flowing downstream from the victim.
                </p>
              </div>
            </GlassCard>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-xl text-center p-6">
          <HelpCircle className="h-10 w-10 text-zinc-500 mb-3" />
          <p className="font-semibold text-sm text-zinc-300">No account traced yet</p>
          <p className="text-xs text-zinc-500 mt-1">
            Search for an account ID or click on one of the suggested victim accounts above to begin tracing the funds path.
          </p>
        </div>
      )}
    </div>
  );
}
