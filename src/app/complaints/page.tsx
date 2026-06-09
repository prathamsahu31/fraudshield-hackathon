'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { formatCurrency } from '@/lib/utils';
import { 
  MessageSquareCode, 
  HelpCircle, 
  User, 
  Building, 
  DollarSign, 
  CheckCircle, 
  AlertOctagon, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
  Ban,
  Plus,
  X,
  Share2,
  AlertTriangle
} from 'lucide-react';

interface ComplaintItem {
  id: string;
  date: string;
  customer_name: string;
  account_id: string;
  transaction_id?: string;
  dispute_type: string;
  amount: number;
  status: 'Pending Review' | 'Chargeback Initiated' | 'Resolved - Refunded' | 'Resolved - Dismissed';
  details: string;
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

interface DetailedComplaint {
  complaint: ComplaintItem;
  linked_transaction?: TransactionItem;
  connected_accounts: AccountItem[];
}

export default function ComplaintsPage() {
  const [complaintsData, setComplaintsData] = useState<DetailedComplaint[]>([]);
  const [selectedItem, setSelectedItem] = useState<DetailedComplaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating a new complaint
  const [showForm, setShowForm] = useState(false);
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formAccountId, setFormAccountId] = useState('');
  const [formDisputeType, setFormDisputeType] = useState('Unauthorized Wire');
  const [formAmount, setFormAmount] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/complaints`);
      if (!res.ok) {
        throw new Error(`Failed to load complaints: ${res.statusText}`);
      }
      const data: DetailedComplaint[] = await res.json();
      setComplaintsData(data);
      
      // Update selected item reference if active
      if (selectedItem) {
        const updated = data.find(d => d.complaint.id === selectedItem.complaint.id);
        if (updated) setSelectedItem(updated);
      } else if (data.length > 0) {
        setSelectedItem(data[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (comp_id: string, newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/complaints/${comp_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error(`Failed to update status: ${res.statusText}`);
      }
      // Refresh list
      await fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formCustomerName,
          account_id: formAccountId,
          dispute_type: formDisputeType,
          amount: Number(formAmount),
          details: formDetails
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error creating dispute claim');
      }

      setSubmitSuccess(true);
      // Reset form
      setFormCustomerName('');
      setFormAccountId('');
      setFormAmount('');
      setFormDetails('');
      
      // Refresh complaints and close form drawer after delay
      await fetchComplaints();
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
      }, 1500);

    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred submitting claim.');
    }
  };

  const getStatusBadge = (status: ComplaintItem['status']) => {
    switch (status) {
      case 'Resolved - Refunded': return 'bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald';
      case 'Resolved - Dismissed': return 'bg-zinc-850 border-zinc-800 text-zinc-500';
      case 'Chargeback Initiated': return 'bg-cyber-amber/10 border-cyber-amber/20 text-cyber-amber';
      default: return 'bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose animate-pulse';
    }
  };

  // Stats aggregate computations
  const getDisputeStats = () => {
    const stats: Record<string, { count: number; value: number }> = {
      'Unauthorized Wire': { count: 0, value: 0 },
      'Identity Theft': { count: 0, value: 0 },
      'Card Skimming': { count: 0, value: 0 },
      'ACH Dispute': { count: 0, value: 0 },
      'Phishing Transfer': { count: 0, value: 0 }
    };

    complaintsData.forEach(d => {
      const type = d.complaint.dispute_type;
      if (stats[type] !== undefined) {
        stats[type].count += 1;
        stats[type].value += d.complaint.amount;
      } else {
        stats[type] = { count: 1, value: d.complaint.amount };
      }
    });

    const colors: Record<string, string> = {
      'Unauthorized Wire': 'bg-cyber-rose',
      'Identity Theft': 'bg-cyber-amber',
      'Card Skimming': 'bg-cyber-blue',
      'ACH Dispute': 'bg-cyber-emerald',
      'Phishing Transfer': 'bg-fuchsia-500'
    };

    return Object.entries(stats).map(([type, data]) => ({
      type,
      count: data.count,
      value: data.value,
      color: colors[type] || 'bg-zinc-500'
    }));
  };

  const stats = getDisputeStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan">
            Customer Disputes & Fraud Claims
          </h1>
          <p className="text-sm text-zinc-400">
            Process customer reports of unauthorized debit cards, compromised wires, and identity theft claims.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          File New Dispute Claim
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <GlassCard key={stat.type} className="p-4">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block truncate">{stat.type}</span>
            <h4 className="text-lg font-bold text-zinc-100 mt-1">{stat.count} Claims</h4>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 font-mono">
              <span>Total Value:</span>
              <span className="text-zinc-300">{formatCurrency(stat.value)}</span>
            </div>
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mt-2">
              <div className={`h-full ${stat.color}`} style={{ width: stat.count > 0 ? '70%' : '0%' }} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Layout Workspace */}
      {loading && complaintsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-xl">
          <Clock className="h-10 w-10 text-cyber-cyan animate-spin mb-3" />
          <p className="font-semibold text-sm text-zinc-300">Retrieving Claims Database...</p>
        </div>
      ) : error ? (
        <div className="p-5 rounded-lg border border-cyber-rose/30 bg-cyber-rose/5 text-cyber-rose flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Failed to Load Disputes</h4>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Columns - Complaints Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-0 overflow-hidden">
              <GlassCardHeader 
                title="Disputes & Claims Registry" 
                subtitle="Triage logs for physical fraud claims and digital account breaches"
                className="p-5"
              />
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      <th className="py-3 px-4">Claim ID / Date</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Dispute Type</th>
                      <th className="py-3 px-4">Disputed Value</th>
                      <th className="py-3 px-4">Resolution Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-xs">
                    {complaintsData.map((d) => {
                      const isSelected = selectedItem?.complaint.id === d.complaint.id;
                      
                      return (
                        <tr 
                          key={d.complaint.id}
                          onClick={() => setSelectedItem(d)}
                          className={`cursor-pointer transition-colors duration-150 ${
                            isSelected ? 'bg-cyber-cyan/5 border-l-2 border-l-cyber-cyan' : 'hover:bg-zinc-900/20'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono">
                            <span className="font-semibold block text-zinc-200">{d.complaint.id}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(d.complaint.date).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-200 font-medium">{d.complaint.customer_name}</td>
                          <td className="py-3 px-4 text-zinc-300">{d.complaint.dispute_type}</td>
                          <td className="py-3 px-4 font-bold text-zinc-200 font-mono">{formatCurrency(d.complaint.amount)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(d.complaint.status)}`}>
                              {d.complaint.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Complaint Action Workspace & Auto-linking (1/3 width) */}
          <div className="space-y-6">
            {selectedItem ? (
              <GlassCard glowColor="cyan" className="space-y-5">
                <GlassCardHeader 
                  title="Dispute Actions Manager" 
                  subtitle={`Triage workspace for ${selectedItem.complaint.id}`}
                />

                {/* Status summary */}
                <div className="p-3.5 border border-zinc-800 rounded-lg bg-zinc-950/40 text-xs space-y-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Customer Name:</span>
                    <span className="text-zinc-200 font-sans font-semibold">{selectedItem.complaint.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Victim Account ID:</span>
                    <span className="text-zinc-350">{selectedItem.complaint.account_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Disputed Amount:</span>
                    <span className="text-zinc-200 font-bold">{formatCurrency(selectedItem.complaint.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Process Status:</span>
                    <span className="font-sans font-bold text-cyber-rose">{selectedItem.complaint.status}</span>
                  </div>
                </div>

                {/* Details narrative */}
                <div className="text-xs space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Claimant Statement</span>
                  <p className="text-zinc-300 bg-zinc-950/20 p-2.5 rounded border border-zinc-900 leading-relaxed">
                    {selectedItem.complaint.details}
                  </p>
                </div>

                {/* Auto-linked Transaction Panel */}
                <div className="space-y-2.5 border-t border-zinc-900 pt-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Auto-Linked Suspicious Transaction</span>
                  
                  {selectedItem.linked_transaction ? (
                    <div className="p-3 border border-zinc-850 rounded-lg bg-zinc-950/60 text-xs space-y-2 relative">
                      <div className="flex justify-between font-mono">
                        <span className="text-zinc-400 font-bold">{selectedItem.linked_transaction.id}</span>
                        <span className={`px-1 rounded text-[8px] font-bold ${
                          selectedItem.linked_transaction.risk_score >= 80 ? 'text-cyber-rose bg-cyber-rose/10' : 'text-cyber-amber bg-cyber-amber/10'
                        }`}>
                          Risk Score: {selectedItem.linked_transaction.risk_score}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono">
                        <div>
                          <span className="text-zinc-500 block">Transfer Amount:</span>
                          <span className="text-zinc-200 font-bold">{formatCurrency(selectedItem.linked_transaction.amount)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Channel Method:</span>
                          <span className="text-zinc-200 font-bold">{selectedItem.linked_transaction.type}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-500 block">Beneficiary Account:</span>
                          <span className="text-zinc-300 truncate block">
                            {selectedItem.linked_transaction.receiver_id} ({selectedItem.linked_transaction.receiver_bank})
                          </span>
                        </div>
                      </div>

                      {selectedItem.linked_transaction.flags && selectedItem.linked_transaction.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-zinc-900/60">
                          {selectedItem.linked_transaction.flags.map(f => (
                            <span key={f} className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-400 font-mono">{f}</span>
                          ))}
                        </div>
                      )}

                      {/* Link to Money Flow Tracing */}
                      <a 
                        href={`/money-flow?account=${selectedItem.complaint.account_id}`}
                        className="mt-2 text-glow-cyan text-cyber-cyan text-[10px] font-semibold flex items-center gap-1 hover:underline justify-end"
                      >
                        Trace Money Flow
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3.5 border border-dashed border-zinc-900 text-center rounded-lg text-zinc-550 text-[11px] leading-snug">
                      No matching suspicious transaction found for this account & value.
                    </div>
                  )}
                </div>

                {/* Connected Accounts List */}
                {selectedItem.connected_accounts && selectedItem.connected_accounts.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-900 pt-4">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Connected Mule Accounts</span>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedItem.connected_accounts.map((acc) => (
                        <div 
                          key={acc.id} 
                          className="p-2.5 bg-zinc-950/40 border border-zinc-900 rounded-lg flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <span className="text-zinc-200 font-semibold font-sans block">{acc.label}</span>
                            <span className="text-[9px] text-zinc-500">{acc.id} • {acc.bank}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${
                            acc.type === 'Mule Hub' ? 'text-cyber-rose bg-cyber-rose/10 border-cyber-rose/25' :
                            acc.type === 'Smurf' ? 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/25' :
                            'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/25'
                          }`}>
                            {acc.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operations Overrides */}
                <div className="space-y-2.5 border-t border-zinc-900 pt-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-2">Resolution Pipelines</span>
                  
                  {selectedItem.complaint.status === 'Pending Review' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedItem.complaint.id, 'Chargeback Initiated')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all duration-150 cursor-pointer"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Initiate Chargeback Reversal
                      </button>
                      
                      <button
                        onClick={() => alert(`Freezing debit cards associated with account ${selectedItem.complaint.account_id}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose hover:bg-cyber-rose/20 transition-all duration-150 cursor-pointer"
                      >
                        <Ban className="h-4 w-4" />
                        Freeze Cards & Credentials
                      </button>
                    </>
                  )}

                  {selectedItem.complaint.status !== 'Resolved - Refunded' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedItem.complaint.id, 'Resolved - Refunded')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald hover:bg-cyber-emerald/20 transition-all duration-150 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve Loss Waiver Refund
                    </button>
                  )}

                  {selectedItem.complaint.status !== 'Resolved - Dismissed' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedItem.complaint.id, 'Resolved - Dismissed')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all duration-150 cursor-pointer"
                    >
                      Dismiss Claim / Mark Abuse
                    </button>
                  )}
                </div>

              </GlassCard>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <MessageSquareCode className="h-10 w-10 text-zinc-600 mb-2" />
                <p className="font-semibold text-sm">Select claim</p>
                <p className="text-xs">Click a dispute record in the table to initiate chargeback resolution pathways.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* File Claim Drawer Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setShowForm(false)} 
          />
          <div className="relative h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl glass-panel">
            
            {/* Drawer Header */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-zinc-900 mb-5">
                <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                  <MessageSquareCode className="h-5 w-5 text-cyber-cyan" />
                  File New Dispute Claim
                </h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {submitError && (
                <div className="p-3 mb-4 rounded bg-cyber-rose/10 border border-cyber-rose/20 text-[11px] text-cyber-rose flex items-start gap-2 animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 mb-4 rounded bg-cyber-emerald/10 border border-cyber-emerald/20 text-[11px] text-cyber-emerald flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Dispute claim filed and auto-linked successfully! Refreshing...</span>
                </div>
              )}

              <form onSubmit={handleCreateComplaint} id="dispute-form" className="space-y-4 text-xs font-mono">
                {/* Customer name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Alice Cooper"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50 font-sans"
                  />
                </div>

                {/* Account ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase block font-sans">Victim Account ID</label>
                  <input
                    type="text"
                    required
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    placeholder="e.g. ACT-SAFE-12"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50"
                  />
                </div>

                {/* Dispute Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase block font-sans">Dispute Type</label>
                  <select
                    value={formDisputeType}
                    onChange={(e) => setFormDisputeType(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50 font-sans"
                  >
                    <option value="Unauthorized Wire">Unauthorized Wire</option>
                    <option value="Card Skimming">Card Skimming</option>
                    <option value="Phishing Transfer">Phishing Transfer</option>
                    <option value="Identity Theft">Identity Theft</option>
                    <option value="ACH Dispute">ACH Dispute</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase block font-sans">Disputed Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 14500.00"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50"
                  />
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase block font-sans">Statement Details</label>
                  <textarea
                    required
                    rows={4}
                    value={formDetails}
                    onChange={(e) => setFormDetails(e.target.value)}
                    placeholder="Provide details regarding the disputed transfer..."
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50 font-sans text-xs leading-normal"
                  />
                </div>
              </form>
            </div>

            {/* Submit Button */}
            <div className="border-t border-zinc-900 pt-4">
              <button
                type="submit"
                form="dispute-form"
                disabled={submitSuccess}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/45 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                Submit and Auto-Link
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
