'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { formatCurrency } from '@/lib/utils';
import { 
  FolderKanban, 
  User, 
  Clock, 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  AlertOctagon, 
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  Flame,
  ArrowLeftRight,
  Building,
  Unlock,
  Coins,
  ShieldCheck,
  Ban,
  TrendingUp,
  Activity
} from 'lucide-react';

interface InvestigationCase {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Reported' | 'Under Review' | 'Escalated' | 'Closed';
  assignee: string;
  created_at: string;
  updated_at: string;
}

interface InvestigationNote {
  id: number;
  case_id: string;
  author: string;
  text: string;
  created_at: string;
}

interface InvestigationTimeline {
  id: number;
  case_id: string;
  action: string;
  user_identity: string;
  details: string;
  created_at: string;
}

interface TransactionItem {
  id: string;
  timestamp: string;
  sender_id: string;
  receiver_id: string;
  receiver_bank: string;
  amount: number;
  type: string;
  risk_score: number;
  status: string;
  flags: string[];
}

interface AccountItem {
  id: string;
  label: string;
  bank: string;
  balance: number;
  risk_score: number;
  type: string;
}

interface DetailedCase {
  case: InvestigationCase;
  timeline: InvestigationTimeline[];
  notes: InvestigationNote[];
  linked_transactions: TransactionItem[];
  linked_accounts: AccountItem[];
}

export default function InvestigationsPage() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detailedCase, setDetailedCase] = useState<DetailedCase | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'Reported' | 'Under Review' | 'Escalated' | 'Closed'>('ALL');
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch case files
  const fetchCases = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/investigations`);
      if (!res.ok) {
        throw new Error(`Failed to load cases: ${res.statusText}`);
      }
      const data: InvestigationCase[] = await res.json();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading case files.');
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch full details of a specific case file
  const fetchCaseDetails = async (caseId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/investigations/${caseId}`);
      if (!res.ok) {
        throw new Error(`Failed to load case details: ${res.statusText}`);
      }
      const data: DetailedCase = await res.json();
      setDetailedCase(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error loading case details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
    } else {
      setDetailedCase(null);
    }
  }, [selectedCaseId]);

  // Add notes dynamically
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedCaseId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/investigations/${selectedCaseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'SecOps Agent (You)',
          text: newNoteText
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to post note: ${res.statusText}`);
      }

      setNewNoteText('');
      // Refresh case details
      await fetchCaseDetails(selectedCaseId);
    } catch (err: any) {
      alert(err.message || 'Error saving note');
    }
  };

  // Trigger Case Escalation
  const handleEscalateCase = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/investigations/${selectedCaseId}/escalate`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`Failed to escalate case: ${res.statusText}`);
      }
      // Refresh list & detail
      await fetchCases();
      await fetchCaseDetails(selectedCaseId);
    } catch (err: any) {
      alert(err.message || 'Error escalating case');
    }
  };

  // Trigger Case Closure
  const handleCloseCase = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/investigations/${selectedCaseId}/close`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`Failed to close case: ${res.statusText}`);
      }
      // Refresh list & detail
      await fetchCases();
      await fetchCaseDetails(selectedCaseId);
    } catch (err: any) {
      alert(err.message || 'Error closing case');
    }
  };

  // Trigger Account Freezing Action
  const handleFreezeAccount = async (accountId: string) => {
    if (!selectedCaseId) return;
    if (!confirm(`Are you sure you want to execute a freeze order on account ${accountId}? This will set its risk score to 100 and block all incoming/outgoing transactions.`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/investigations/${selectedCaseId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId })
      });

      if (!res.ok) {
        throw new Error(`Asset freeze execution failed: ${res.statusText}`);
      }

      alert(`Freeze orders dispatched. Account ${accountId} locked.`);
      // Refresh case details
      await fetchCaseDetails(selectedCaseId);
    } catch (err: any) {
      alert(err.message || 'Error freezing account');
    }
  };

  const filteredCases = cases.filter(c => activeTab === 'ALL' || c.status === activeTab);

  const getSeverityBadge = (sev: InvestigationCase['severity']) => {
    switch (sev) {
      case 'Critical': return 'text-cyber-rose bg-cyber-rose/10 border-cyber-rose/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
      case 'High': return 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/30';
      case 'Medium': return 'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/30';
      default: return 'text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/30';
    }
  };

  const getStatusBadge = (status: InvestigationCase['status']) => {
    switch (status) {
      case 'Closed': return 'bg-zinc-900 border-zinc-800 text-zinc-550';
      case 'Escalated': return 'bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose';
      case 'Under Review': return 'bg-cyber-blue/10 border-cyber-blue/20 text-cyber-blue';
      default: return 'bg-cyber-amber/10 border-cyber-amber/20 text-cyber-amber animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan flex items-center gap-2">
          <FolderKanban className="h-7 w-7 text-cyber-cyan" />
          Investigation Case Dashboard
        </h1>
        <p className="text-sm text-zinc-400">
          Conduct audit trails, freeze assets, compile networks, and draft regulatory SAR report logs.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-px">
        {['ALL', 'Reported', 'Under Review', 'Escalated', 'Closed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
              (activeTab === tab) 
                ? 'border-cyber-cyan text-cyber-cyan font-bold bg-cyber-cyan/5 text-glow-cyan' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loadingList && cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-xl">
          <Clock className="h-10 w-10 text-cyber-cyan animate-spin mb-3" />
          <p className="font-semibold text-sm text-zinc-300">Loading Active Incidents File...</p>
        </div>
      ) : error ? (
        <div className="p-5 rounded-lg border border-cyber-rose/30 bg-cyber-rose/5 text-cyber-rose flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Failed to Load Investigation Case Files</h4>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Columns - Cases list (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCases.map((c) => {
                const isSelected = selectedCaseId === c.id;
                
                return (
                  <GlassCard 
                    key={c.id} 
                    onClick={() => setSelectedCaseId(c.id)}
                    glowColor={isSelected ? (c.severity === 'Critical' ? 'rose' : 'cyan') : 'none'}
                    className={`cursor-pointer transition-all duration-200 p-4 ${
                      isSelected ? 'bg-zinc-900/60 border-cyber-cyan/40' : 'hover:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2.5">
                      <span className="font-mono text-xs text-zinc-500 font-bold">{c.id}</span>
                      <div className="flex gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${getSeverityBadge(c.severity)}`}>
                          {c.severity}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-zinc-100 line-clamp-1 group-hover:text-cyber-cyan">{c.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{c.description}</p>
                    
                    {/* Status, updated time, assignee */}
                    <div className="flex items-center justify-between border-t border-zinc-900/60 mt-4 pt-3 text-[10px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-cyber-cyan" />
                        {c.assignee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(c.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </GlassCard>
                );
              })}

              {filteredCases.length === 0 && (
                <div className="col-span-2 py-16 text-center text-zinc-500 border border-dashed border-zinc-900 rounded-lg">
                  <FolderKanban className="h-10 w-10 mx-auto text-zinc-700 mb-2" />
                  <p className="font-semibold text-sm">No cases found</p>
                  <p className="text-xs">There are no audit files under this status category.</p>
                </div>
              )}
            </div>

            {/* Render transaction history & linked accounts lists only if case is loaded */}
            {detailedCase && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Linked Accounts Panel */}
                <GlassCard className="p-4 space-y-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-cyber-cyan" />
                    Connected Account Profiles ({detailedCase.linked_accounts.length})
                  </span>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {detailedCase.linked_accounts.map(acc => {
                      const isVictim = acc.type === 'Standard' && acc.risk_score < 40;
                      return (
                        <div key={acc.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg flex flex-col justify-between gap-3 text-xs">
                          <div className="flex justify-between items-start gap-1 font-mono">
                            <div>
                              <strong className="text-zinc-200 font-sans font-semibold block">{acc.label}</strong>
                              <span className="text-[9px] text-zinc-500">{acc.id} • {acc.bank}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                              acc.risk_score >= 80 ? 'text-cyber-rose bg-cyber-rose/10 border-cyber-rose/20' :
                              acc.risk_score >= 50 ? 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/20' :
                              'text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/20'
                            }`}>
                              {acc.type === 'Standard' && isVictim ? 'Victim' : acc.type}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-900/60 pt-2">
                            <div>
                              <span className="text-zinc-500 block">Balance:</span>
                              <span className="text-zinc-300 font-bold">{formatCurrency(acc.balance)}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">Risk Index:</span>
                              <span className={`font-bold ${
                                acc.risk_score >= 80 ? 'text-cyber-rose' :
                                acc.risk_score >= 50 ? 'text-cyber-amber' :
                                'text-cyber-emerald'
                              }`}>{acc.risk_score} / 100</span>
                            </div>
                          </div>

                          {/* Freeze controls */}
                          {acc.risk_score < 100 && acc.type !== 'Standard' && (
                            <button
                              onClick={() => handleFreezeAccount(acc.id)}
                              className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold rounded bg-cyber-rose/10 border border-cyber-rose/25 text-cyber-rose hover:bg-cyber-rose/20 transition-all duration-150 cursor-pointer uppercase tracking-wider"
                            >
                              <Ban className="h-3 w-3" />
                              Freeze Assets & Block Account
                            </button>
                          )}
                          
                          {acc.risk_score >= 100 && (
                            <span className="mt-1 w-full flex items-center justify-center gap-1 py-1 px-2 text-[9px] font-bold rounded bg-zinc-900 border border-zinc-800 text-zinc-500 uppercase">
                              Account Locked / Assets Frozen
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* Transaction history list */}
                <GlassCard className="p-4 space-y-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-cyber-cyan" />
                    Transaction Audit Ledger ({detailedCase.linked_transactions.length})
                  </span>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {detailedCase.linked_transactions.map(tx => (
                      <div key={tx.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs space-y-2 font-mono">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-200">{tx.id}</span>
                          <span className={`text-[10px] font-bold ${
                            tx.status === 'Blocked' ? 'text-cyber-rose' :
                            tx.status === 'Flagged' ? 'text-cyber-amber' :
                            'text-cyber-emerald'
                          }`}>{tx.status}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-550 border-t border-b border-zinc-900/60 py-2 my-1.5">
                          <div>
                            <span>Dispatched Value:</span>
                            <span className="text-zinc-200 font-bold block">{formatCurrency(tx.amount)}</span>
                          </div>
                          <div>
                            <span>Risk Score:</span>
                            <span className={`font-bold block ${
                              tx.risk_score >= 80 ? 'text-cyber-rose' :
                              tx.risk_score >= 50 ? 'text-cyber-amber' :
                              'text-cyber-emerald'
                            }`}>{tx.risk_score} / 100</span>
                          </div>
                          <div className="col-span-2">
                            <span>Route:</span>
                            <span className="text-zinc-300 block truncate">{tx.sender_id} → {tx.receiver_id}</span>
                          </div>
                        </div>

                        {tx.flags && tx.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tx.flags.map(f => (
                              <span key={f} className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-400 font-mono leading-none">{f}</span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-[9px] text-zinc-500 text-right">
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

              </div>
            )}
          </div>

          {/* Right Column - Case Details Workspace (1/3 width) */}
          <div>
            {detailedCase ? (
              <GlassCard 
                glowColor={detailedCase.case.severity === 'Critical' ? 'rose' : 'cyan'} 
                className="space-y-5"
              >
                <div className="flex justify-between items-center">
                  <GlassCardHeader 
                    title={`Incident File: ${detailedCase.case.id}`} 
                    subtitle="Security compliance workspace"
                  />
                  
                  {detailedCase.case.severity === 'Critical' && (
                    <Flame className="h-5 w-5 text-cyber-rose animate-pulse text-glow-rose shrink-0" />
                  )}
                </div>

                {/* Risk Indicators Section */}
                <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-xs space-y-3 font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Threat Risk Indicators</span>
                  
                  <div className="flex justify-between">
                    <span>Severity Rank:</span>
                    <span className={`font-bold font-sans uppercase ${
                      detailedCase.case.severity === 'Critical' ? 'text-cyber-rose' : 'text-cyber-amber'
                    }`}>{detailedCase.case.severity}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Peak Node Threat:</span>
                    <span className="text-cyber-rose font-bold">
                      {Math.max(...detailedCase.linked_accounts.map(a => a.risk_score), 0)} / 100
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Audit Pipeline Status:</span>
                    <span className="text-cyber-cyan font-bold">{detailedCase.case.status}</span>
                  </div>
                </div>

                {/* Case Description */}
                <div className="text-xs space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Audit Investigation Summary</span>
                  <p className="text-zinc-300 bg-zinc-950/30 p-2.5 rounded border border-zinc-900 leading-relaxed font-sans">
                    {detailedCase.case.description}
                  </p>
                </div>

                {/* Notes Feed */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-cyber-cyan" />
                    Investigator Narrative ({detailedCase.notes.length})
                  </span>
                  
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {detailedCase.notes.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 italic text-center py-2">No notes recorded yet.</p>
                    ) : (
                      detailedCase.notes.map(n => (
                        <div key={n.id} className="p-2.5 rounded bg-zinc-900/30 border border-zinc-900 text-[11px] space-y-1">
                          <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                            <span className="font-semibold text-zinc-400">{n.author}</span>
                            <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-zinc-300 font-sans leading-normal">{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add note form */}
                  <form onSubmit={handleAddNote} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add operational notes..."
                      className="flex-1 rounded border border-zinc-800 bg-zinc-950/60 py-2 px-3 text-xs text-zinc-200 placeholder-zinc-600 focus:border-cyber-cyan/50 focus:outline-none font-sans"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Action Log Timeline */}
                <div className="space-y-2.5 border-t border-zinc-900 pt-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-cyber-cyan" />
                    Audit Action Timeline
                  </span>
                  
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 font-mono text-[10px]">
                    {detailedCase.timeline.map((evt, idx) => (
                      <div key={idx} className="flex gap-2 items-start border-l border-zinc-900 pl-2">
                        <span className="text-[8.5px] text-zinc-650 shrink-0">
                          {new Date(evt.created_at).toLocaleTimeString()}
                        </span>
                        <div>
                          <span className="text-zinc-300 font-semibold block">{evt.action}</span>
                          <span className="text-[9px] text-zinc-500 leading-normal block mt-0.5">{evt.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions override */}
                <div className="space-y-2 border-t border-zinc-900 pt-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Operational Interventions</span>
                  
                  {detailedCase.case.status !== 'Closed' && (
                    <div className="grid grid-cols-2 gap-2">
                      {detailedCase.case.status !== 'Escalated' && (
                        <button
                          onClick={handleEscalateCase}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded bg-cyber-amber/10 border border-cyber-amber/35 text-cyber-amber hover:bg-cyber-amber/20 transition-all duration-150 cursor-pointer"
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          Escalate Case
                        </button>
                      )}
                      
                      <button
                        onClick={handleCloseCase}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded bg-cyber-emerald/10 border border-cyber-emerald/35 text-cyber-emerald hover:bg-cyber-emerald/20 transition-all duration-150 cursor-pointer col-span-1"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Resolve & Close
                      </button>
                    </div>
                  )}

                  {detailedCase.case.status === 'Closed' && (
                    <span className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded bg-zinc-900 border border-zinc-850 text-zinc-500 uppercase">
                      <CheckCircle className="h-4 w-4" />
                      Case Audited & Closed
                    </span>
                  )}
                </div>

              </GlassCard>
            ) : loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-xl text-center">
                <Clock className="h-10 w-10 text-cyber-cyan animate-spin mb-3" />
                <p className="font-semibold text-xs text-zinc-300">Retrieving case timeline & notes...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <FolderKanban className="h-10 w-10 text-zinc-600 mb-2" />
                <p className="font-semibold text-sm">Select case</p>
                <p className="text-xs">Select any incident file to inspect notes and log timeline audit history.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
