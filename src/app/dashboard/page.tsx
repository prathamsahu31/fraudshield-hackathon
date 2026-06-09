'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { 
  systemStatus, 
  transactionsMockData, 
  Transaction 
} from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  FolderSearch, 
  Activity, 
  Play,
  XCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// Animation variants for staggered entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Transaction[]>(
    transactionsMockData.filter(t => t.status === 'Flagged' || t.status === 'Under Review')
  );

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const threatVectors = [
    { name: 'Mule Ring Accounts', percentage: 42, count: 18, color: 'bg-cyber-rose' },
    { name: 'Identity Theft / Takeover', percentage: 28, count: 12, color: 'bg-cyber-amber' },
    { name: 'Impossible Velocity Logins', percentage: 18, count: 8, color: 'bg-cyber-blue' },
    { name: 'Card Skimming / CNP', percentage: 12, count: 5, color: 'bg-cyber-emerald' },
  ];

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan">
            Security Operations Dashboard
          </h1>
          <p className="text-sm text-zinc-400">
            Real-time fraud intelligence, network detection, and rule simulators.
          </p>
        </div>
        
        {/* Time Stamp Status */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-400 font-mono shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 rounded-full bg-cyber-emerald animate-pulse" />
          SYSTEM LIVE: JUN 06, 2026 03:06 UTC
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassCard glowColor="rose" hoverEffect className="relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Alerts</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2 font-mono">{alerts.length}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-rose/10 border border-cyber-rose/20 text-cyber-rose shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-cyber-rose">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+12.4% vs last hour</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="cyan" hoverEffect>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">False Positive Rate</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2 font-mono">{systemStatus.falsePositiveRate}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-cyber-cyan">
            <TrendingDown className="h-3 w-3 mr-1" />
            <span>-0.8% efficiency gain</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="emerald" hoverEffect>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fraud Losses Prevented</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2 font-mono">
                {formatCurrency(systemStatus.fraudPreventedToday)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-cyber-emerald">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+$24.3k saved since 00:00</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="amber" hoverEffect>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Open Cases</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2 font-mono">{systemStatus.openInvestigations}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-amber/10 border border-cyber-amber/20 text-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <FolderSearch className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-zinc-400">
            <span>6 assigned to current shift</span>
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Grid: Threat radar & Alerts triage */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 columns - Active Alert Feed */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <GlassCardHeader 
              title="Recent Threat Alarms Queue" 
              subtitle="Real-time transaction scoring flags requiring investigator intervention"
              action={
                <Link href="/transactions" className="text-xs text-cyber-cyan hover:underline font-semibold tracking-wide">
                  View Full Logs →
                </Link>
              }
            />

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <CheckCircle2 className="h-10 w-10 text-cyber-emerald mb-2" />
                <p className="font-semibold text-sm">Alert queue clear</p>
                <p className="text-xs">All threat alarms resolved or under active assignment.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {alerts.map((a) => (
                  <div 
                    key={a.id} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800/80 transition-all duration-200 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-200">{a.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          a.riskScore >= 80 
                            ? 'bg-cyber-rose/10 border-cyber-rose/30 text-cyber-rose' 
                            : 'bg-cyber-amber/10 border-cyber-amber/30 text-cyber-amber'
                        }`}>
                          Score: {a.riskScore}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{a.timestamp}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-200">
                        {a.sender} transferred {formatCurrency(a.amount)} ({a.type})
                      </p>
                      <p className="text-xs text-zinc-400">
                        Target: <span className="text-zinc-300 font-mono">{a.receiver} ({a.receiverBank})</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {a.flags.map(f => (
                          <span key={f} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-zinc-900 text-zinc-400 rounded-sm border border-zinc-800">
                            <AlertTriangle className="h-2 w-2 text-cyber-amber" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Triage Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button 
                        onClick={() => handleDismiss(a.id)}
                        className="flex items-center justify-center rounded p-1.5 text-zinc-500 hover:text-cyber-emerald hover:bg-cyber-emerald/10 border border-transparent hover:border-cyber-emerald/20 transition-all duration-150"
                        title="Dismiss alert"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <Link 
                        href={`/investigations?caseId=CASE-2026-01`}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Triage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right column - Radar Scan & Threat vectors */}
        <div className="space-y-6">
          {/* Radar Scanning Widget */}
          <GlassCard glowColor="cyan" className="flex flex-col items-center justify-center text-center py-6 relative overflow-hidden">
            <h4 className="font-semibold text-zinc-300 tracking-wide text-xs mb-6 uppercase">Node Status Radar</h4>
            
            <div className="relative h-40 w-40 rounded-full border border-cyber-cyan/20 flex items-center justify-center mb-6">
              {/* Radar sweep lines */}
              <div className="absolute inset-0 rounded-full border border-dashed border-cyber-cyan/10 scale-75" />
              <div className="absolute inset-0 rounded-full border border-dotted border-cyber-cyan/5 scale-50" />
              <div className="absolute h-full w-full rounded-full border border-transparent border-t-cyber-cyan/40 border-r-cyber-cyan/10 animate-radar" />
              
              {/* Central Node */}
              <div className="relative z-10 h-7 w-7 rounded-full bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <ShieldAlert className="h-4 w-4" />
              </div>
              
              {/* Random ping indicators */}
              <span className="absolute top-10 right-10 h-1.5 w-1.5 rounded-full bg-cyber-rose animate-ping" />
              <span className="absolute bottom-12 left-6 h-1.5 w-1.5 rounded-full bg-cyber-amber animate-ping" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono text-zinc-400">THREAT DEFCON LEVEL</p>
              <h5 className="font-bold text-lg text-cyber-rose tracking-wider text-glow-rose">ELEVATED: LEVEL 3</h5>
              <p className="text-[10px] text-zinc-500 italic">External networks scanning: 4,921 endpoints/min</p>
            </div>
          </GlassCard>

          {/* Threat Vector Breakdown */}
          <GlassCard>
            <GlassCardHeader title="Threat Vectors Breakdown" subtitle="Distribution of active fraud scenarios" />
            <div className="space-y-4">
              {threatVectors.map((tv) => (
                <div key={tv.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300 font-medium">{tv.name}</span>
                    <span className="text-zinc-400 font-mono">{tv.count} cases ({tv.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${tv.color} rounded-full`}
                      style={{ width: `${tv.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}
