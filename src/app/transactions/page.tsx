'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { formatCurrency, formatRiskScore } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  ArrowLeftRight, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Smartphone, 
  Globe, 
  AlertTriangle,
  RefreshCcw,
  FolderOpen,
  ArrowUpDown,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface ApiTransaction {
  id: string;
  timestamp: string;
  sender_id: string;
  receiver_id: string;
  receiver_bank: string;
  amount: number;
  type: string;
  risk_score: number;
  status: 'Flagged' | 'Cleared' | 'Under Review' | 'Blocked';
  flags: string[];
  geo_ip: string;
  location: string;
  device: string;
}

interface ApiAccount {
  id: string;
  label: string;
  bank: string;
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<ApiTransaction[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, string>>({});
  const [selectedTxn, setSelectedTxn] = useState<ApiTransaction | null>(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Searching States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Sorting States
  const [sortField, setSortField] = useState<'timestamp' | 'amount' | 'risk_score'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 1. Fetch Accounts mapping (to translate sender_id to owner name)
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/accounts`);
        if (res.ok) {
          const data: ApiAccount[] = await res.json();
          const mapping: Record<string, string> = {};
          data.forEach(acc => {
            mapping[acc.id] = acc.label;
          });
          setAccountsMap(mapping);
        }
      } catch (err) {
        console.error("Error loading accounts map:", err);
      }
    };
    fetchAccounts();
  }, []);

  // 2. Fetch Transactions from FastAPI backend (with search/status params)
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/transactions`;
        const params: string[] = [];
        
        if (search.trim()) {
          params.push(`search=${encodeURIComponent(search.trim())}`);
        }
        if (statusFilter !== 'ALL') {
          params.push(`status=${encodeURIComponent(statusFilter)}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`API returned status code: ${res.status}`);
        }
        
        const data: ApiTransaction[] = await res.json();
        setTxns(data);
        setError(null);
        
        // Reset selected txn context if it is no longer in data
        if (data.length > 0) {
          // Keep selection if it's still available, else default to first
          setSelectedTxn(prev => {
            if (prev) {
              const matched = data.find(t => t.id === prev.id);
              return matched || data[0];
            }
            return data[0];
          });
        } else {
          setSelectedTxn(null);
        }
        
        // Reset page to 1 on filters change
        setCurrentPage(1);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError("Error: Backend offline or unreachable. Please launch Uvicorn on port 8000.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce backend query searches
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // 3. Post Resolution Override to Backend
  const handleUpdateStatus = async (id: string, newStatus: ApiTransaction['status']) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/transactions/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        throw new Error("Override API failed");
      }
      
      const updatedTxn: ApiTransaction = await res.json();
      
      // Update state local variables
      setTxns(prev => prev.map(t => t.id === id ? updatedTxn : t));
      if (selectedTxn && selectedTxn.id === id) {
        setSelectedTxn(updatedTxn);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync override status with API server.");
    }
  };

  // 4. Client-side risk bounds filter logic
  const filteredByRisk = txns.filter(t => {
    if (riskFilter === 'ALL') return true;
    if (riskFilter === 'CRITICAL') return t.risk_score >= 80;
    if (riskFilter === 'HIGH') return t.risk_score >= 50 && t.risk_score < 80;
    if (riskFilter === 'LOW') return t.risk_score < 50;
    return true;
  });

  // 5. Client-side Sorting logic
  const sortedTxns = [...filteredByRisk].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    // Sort amounts and risk scores as numbers, dates as strings
    if (sortField === 'amount' || sortField === 'risk_score') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    } else {
      // timestamp sort
      return sortOrder === 'asc' 
        ? new Date(aVal).getTime() - new Date(bVal).getTime() 
        : new Date(bVal).getTime() - new Date(aVal).getTime();
    }
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // 6. Pagination details
  const totalItems = sortedTxns.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTxns = sortedTxns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getRiskHighlight = (score: number) => {
    if (score >= 80) return 'bg-cyber-rose/5 border-l-2 border-l-cyber-rose/80';
    if (score >= 50) return 'bg-cyber-amber/5 border-l-2 border-l-cyber-amber/80';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan">
          Transaction Audit & Triage
        </h1>
        <p className="text-sm text-zinc-400">
          Scoring engine ledger synchronizing directly with live FastAPI backend.
        </p>
      </div>

      {/* Connection Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-cyber-rose/15 border border-cyber-rose/35 text-xs text-cyber-rose flex items-center gap-2 animate-pulse">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Transaction list & Filters */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by ID, Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 py-1.5 pr-4 pl-9 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyber-cyan/50 focus:outline-none"
                />
              </div>

              {/* Dropdown filters */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Risk Score:</span>
                  <select
                    value={riskFilter}
                    onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 py-1 px-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="ALL">All Scores</option>
                    <option value="CRITICAL">Critical (&gt;=80)</option>
                    <option value="HIGH">High Risk (&gt;=50)</option>
                    <option value="LOW">Low Risk (&lt;50)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>API Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 py-1 px-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Transactions List */}
          <GlassCard className="overflow-hidden p-0 relative min-h-[300px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-sm z-10 py-16">
                <Loader2 className="h-8 w-8 text-cyber-cyan animate-spin mb-2" />
                <span className="text-xs text-zinc-400 font-mono">Syncing API ledger...</span>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850/80 bg-zinc-900/35 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    <th 
                      onClick={() => handleSort('timestamp')}
                      className="py-3 px-4 cursor-pointer hover:bg-zinc-800/40 select-none"
                    >
                      <span className="flex items-center gap-1">
                        TXN ID / Date
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="py-3 px-4">Origin Account / Party</th>
                    <th 
                      onClick={() => handleSort('amount')}
                      className="py-3 px-4 cursor-pointer hover:bg-zinc-800/40 select-none"
                    >
                      <span className="flex items-center gap-1">
                        Amount
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('risk_score')}
                      className="py-3 px-4 text-center cursor-pointer hover:bg-zinc-800/40 select-none"
                    >
                      <span className="flex items-center justify-center gap-1">
                        Score
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="py-3 px-4">Resolution</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-xs">
                  {paginatedTxns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                        No transactions returned from API database.
                      </td>
                    </tr>
                  ) : (
                    paginatedTxns.map((t) => {
                      const isSelected = selectedTxn?.id === t.id;
                      const risk = formatRiskScore(t.risk_score);
                      const isSuspicious = t.risk_score >= 50;
                      
                      return (
                        <tr 
                          key={t.id}
                          onClick={() => setSelectedTxn(t)}
                          className={`cursor-pointer transition-colors duration-150 ${
                            isSelected 
                              ? 'bg-cyber-cyan/5 border-l-2 border-l-cyber-cyan' 
                              : getRiskHighlight(t.risk_score)
                          } hover:bg-zinc-900/35`}
                        >
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-semibold block text-zinc-200">{t.id}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(t.timestamp).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-zinc-200">
                              {accountsMap[t.sender_id] || t.sender_id}
                            </div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{t.sender_id}</span>
                              <span>→</span>
                              <span className="truncate max-w-[120px]">{t.receiver_id}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-zinc-200">{formatCurrency(t.amount)}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.type}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block w-8 py-0.5 rounded text-[10px] font-bold border ${risk.color} ${risk.bg} ${risk.border} ${risk.glow}`}>
                              {t.risk_score}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              t.status === 'Cleared' ? 'bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald' :
                              t.status === 'Blocked' ? 'bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose' :
                              t.status === 'Flagged' ? 'bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.15)]' :
                              'bg-cyber-amber/10 border-cyber-amber/20 text-cyber-amber'
                            }`}>
                              {t.status === 'Cleared' && <CheckCircle className="h-3 w-3" />}
                              {t.status === 'Blocked' && <XCircle className="h-3 w-3" />}
                              {t.status === 'Flagged' && <AlertTriangle className="h-3 w-3" />}
                              {t.status === 'Under Review' && <Clock className="h-3 w-3" />}
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <ChevronRight className="h-4 w-4 text-zinc-600" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-900 bg-zinc-950/20 text-xs text-zinc-400">
                <div>
                  Showing <strong className="text-zinc-200">{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-zinc-200">{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of <strong className="text-zinc-200">{totalItems}</strong> entries
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-zinc-200">{currentPage}</span> / <span>{totalPages}</span>
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Transaction detail inspection panel */}
        <div>
          {selectedTxn ? (
            <GlassCard glowColor={selectedTxn.risk_score >= 80 ? 'rose' : selectedTxn.risk_score >= 50 ? 'amber' : 'cyan'} className="sticky top-20">
              <GlassCardHeader 
                title="Security Ledger Inspector" 
                subtitle={`Audit trail details for ${selectedTxn.id}`} 
              />
              
              <div className="space-y-4">
                {/* Gauge Circle */}
                <div className="flex flex-col items-center justify-center p-4 border border-zinc-800/80 rounded-lg bg-zinc-950/40 relative">
                  <div className="text-xs text-zinc-500 font-mono">AUTOMATED SYSTEM THREAT SCORE</div>
                  <div className="text-4xl font-extrabold mt-2 font-mono text-glow-cyan text-zinc-200">
                    {selectedTxn.risk_score}
                  </div>
                  <span className={`mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded border ${
                    formatRiskScore(selectedTxn.risk_score).color
                  } ${formatRiskScore(selectedTxn.risk_score).bg} ${formatRiskScore(selectedTxn.risk_score).border}`}>
                    {formatRiskScore(selectedTxn.risk_score).text}
                  </span>
                </div>

                {/* Flags list */}
                {selectedTxn.flags && selectedTxn.flags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Triggered Risk Flags</span>
                    <div className="space-y-1.5">
                      {selectedTxn.flags.map(f => (
                        <div key={f} className="flex gap-2 items-start p-2 rounded bg-cyber-rose/5 border border-cyber-rose/20 text-xs text-cyber-rose">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entity Details */}
                <div className="space-y-2.5 border-t border-b border-zinc-900 py-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Origin Party:</span>
                    <span className="text-zinc-200 font-medium">
                      {accountsMap[selectedTxn.sender_id] || selectedTxn.sender_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Debit Account:</span>
                    <span className="text-zinc-300 font-mono">{selectedTxn.sender_id}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Beneficiary Party:</span>
                    <span className="text-zinc-200 font-medium">
                      {accountsMap[selectedTxn.receiver_id] || selectedTxn.receiver_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Credit Account:</span>
                    <span className="text-zinc-300 font-mono">{selectedTxn.receiver_id}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Credit Institution:</span>
                    <span className="text-zinc-300">{selectedTxn.receiver_bank}</span>
                  </div>
                </div>

                {/* Network Metadata */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Globe className="h-3.5 w-3.5 text-cyber-cyan" />
                    <span>IP Location: <strong className="text-zinc-300">{selectedTxn.location || 'Unknown'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 text-cyber-cyan" />
                    <span>Network IP Address: <strong className="text-zinc-300 font-mono">{selectedTxn.geo_ip || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Smartphone className="h-3.5 w-3.5 text-cyber-cyan" />
                    <span>Device Context: <strong className="text-zinc-300">{selectedTxn.device || 'Standard Web'}</strong></span>
                  </div>
                </div>

                {/* Action override buttons */}
                <div className="space-y-2 border-t border-zinc-900 pt-4">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-2">Override Resolution Decision</div>
                  
                  {selectedTxn.status !== 'Cleared' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTxn.id, 'Cleared')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald hover:bg-cyber-emerald/20 transition-all duration-150"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve & Clear Funds
                    </button>
                  )}

                  {selectedTxn.status !== 'Blocked' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTxn.id, 'Blocked')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose hover:bg-cyber-rose/20 transition-all duration-150"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline & Freeze Account
                    </button>
                  )}

                  <Link
                    href={`/investigations?caseId=CASE-2026-01`}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all duration-150"
                  >
                    <FolderOpen className="h-4 w-4 text-cyber-cyan" />
                    Link to Case Investigation
                  </Link>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              <ArrowLeftRight className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="font-semibold text-sm">Select a transaction</p>
              <p className="text-xs">Click any log item to initiate security inspection.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
