'use client';

import React, { useState } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  HelpCircle, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Flame 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d');

  const stats = [
    { name: 'Model Recall Score', value: '98.2%', change: '+1.4%', status: 'optimal' },
    { name: 'Average Resolution Time', value: '14.2 min', change: '-4.6 min', status: 'optimal' },
    { name: 'Total Fraud Checked', value: '$84.2M', change: '+$12.8M', status: 'neutral' },
    { name: 'ML Classifier Precision', value: '94.6%', change: '+0.8%', status: 'optimal' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan">
            Fraud Analytics & Classifier Performance
          </h1>
          <p className="text-sm text-zinc-400">
            Analyze machine learning threshold distributions, historical loss rates, and investigator SLA trends.
          </p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
          {['7d', '30d', '90d'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-md transition-all duration-150 ${
                timeframe === t 
                  ? 'bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan font-semibold shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'border border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <GlassCard key={s.name} hoverEffect>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">{s.name}</span>
            <h4 className="text-2xl font-bold text-zinc-100 mt-2 font-mono">{s.value}</h4>
            <div className="flex justify-between items-center text-[10px] text-cyber-emerald mt-2 font-mono">
              <span className="flex items-center gap-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                {s.change}
              </span>
              <span className="text-zinc-500">vs last period</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Fraud Prevention vs Losses */}
        <GlassCard>
          <GlassCardHeader 
            title="Loss Prevention vs Incurred Losses ($)" 
            subtitle="Comparing monthly dollars saved by FraudShield AI vs reported leakage losses"
            action={
              <button 
                onClick={() => alert('Downloading Loss Prevention ledger CSV.')}
                className="rounded p-1.5 text-zinc-500 hover:text-cyber-cyan hover:bg-zinc-900"
              >
                <Download className="h-4 w-4" />
              </button>
            }
          />
          
          {/* Custom SVG Area/Line Chart */}
          <div className="relative h-64 w-full mt-4 flex items-center justify-center bg-zinc-950/45 rounded-lg border border-zinc-900/60 p-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#18181b" strokeDasharray="4" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#18181b" strokeDasharray="4" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#18181b" strokeDasharray="4" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#18181b" strokeDasharray="4" />

              {/* Losses Line (Red) */}
              <path 
                d="M 40 160 L 120 150 L 200 155 L 280 145 L 360 165 L 440 170" 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="2.5" 
                className="drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]"
              />
              
              {/* Saved Area/Line (Cyan Glow) */}
              <path 
                d="M 40 130 L 120 100 L 200 70 L 280 40 L 360 55 L 440 25 L 440 170 L 40 170 Z" 
                fill="url(#cyan-gradient)" 
                opacity="0.12"
              />
              <path 
                d="M 40 130 L 120 100 L 200 70 L 280 40 L 360 55 L 440 25" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="3" 
                className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              />

              {/* Gradients definitions */}
              <defs>
                <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Axis labels */}
              <text x="440" y="190" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">MAY</text>
              <text x="360" y="190" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">APR</text>
              <text x="280" y="190" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">MAR</text>
              <text x="200" y="190" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">FEB</text>
              <text x="120" y="190" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">JAN</text>
              <text x="40" y="190" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">DEC</text>
              
              <text x="30" y="25" className="fill-zinc-550 font-mono text-[8px]" textAnchor="end">$250k</text>
              <text x="30" y="125" className="fill-zinc-550 font-mono text-[8px]" textAnchor="end">$100k</text>
              <text x="30" y="175" className="fill-zinc-550 font-mono text-[8px]" textAnchor="end">$0</text>
            </svg>
            
            {/* Chart Legend */}
            <div className="absolute bottom-2 left-4 flex gap-4 text-[9px] font-mono uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-cyber-cyan" />
                <span className="text-zinc-350">Fraud Prevented</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-cyber-rose" />
                <span className="text-zinc-350">Actual Leakage Losses</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Chart 2: ML Model precision recall distributions */}
        <GlassCard>
          <GlassCardHeader 
            title="ML Model Precision/Recall Classifier Metrics" 
            subtitle="Evaluating False Alarm rate vs True Threat captures under different release cycles"
            action={
              <button 
                onClick={() => alert('Model deployment payload metadata copied.')}
                className="rounded p-1.5 text-zinc-500 hover:text-cyber-cyan hover:bg-zinc-900"
              >
                <Activity className="h-4 w-4" />
              </button>
            }
          />

          {/* SVG Line Chart */}
          <div className="relative h-64 w-full mt-4 flex items-center justify-center bg-zinc-950/45 rounded-lg border border-zinc-900/60 p-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Coordinates Grid */}
              <line x1="50" y1="20" x2="480" y2="20" stroke="#18181b" />
              <line x1="50" y1="170" x2="480" y2="170" stroke="#18181b" />
              <line x1="50" y1="20" x2="50" y2="170" stroke="#18181b" />
              <line x1="480" y1="20" x2="480" y2="170" stroke="#18181b" />

              {/* Ideal baseline diagonal */}
              <line x1="50" y1="170" x2="480" y2="20" stroke="#27272a" strokeDasharray="3" />

              {/* Classifier v3.2 Curve (Amber) */}
              <path 
                d="M 50 20 Q 300 25 450 150 T 480 170" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="2"
              />

              {/* Classifier v4.0 Beta Curve (Cyan Glow) */}
              <path 
                d="M 50 20 Q 400 22 470 120 T 480 170" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="3"
                className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              />

              {/* Grid Labels */}
              <text x="265" y="192" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">RECALL RATE (TRUE POSITIVE)</text>
              <text x="18" y="95" transform="rotate(-90 18 95)" className="fill-zinc-500 font-mono text-[9px]" textAnchor="middle">PRECISION RATE</text>
              
              <text x="475" y="180" className="fill-zinc-600 font-mono text-[8px]" textAnchor="end">1.0</text>
              <text x="55" y="180" className="fill-zinc-600 font-mono text-[8px]">0.0</text>
              
              <text x="42" y="25" className="fill-zinc-600 font-mono text-[8px]" textAnchor="end">1.0</text>
              <text x="42" y="165" className="fill-zinc-600 font-mono text-[8px]" textAnchor="end">0.0</text>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-4 flex gap-4 text-[9px] font-mono uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-cyber-cyan" />
                <span className="text-zinc-350">v4.0 Beta (Active)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-cyber-amber" />
                <span className="text-zinc-350">v3.2 Legacy (Mirror)</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Export Report Actions Center */}
      <GlassCard className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 bg-zinc-950/40 border border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-100">Export Intelligence Reports</h4>
            <p className="text-xs text-zinc-400">Generate executive audits for compliance reporting and FinCEN SAR drafts.</p>
          </div>
        </div>
        
        <button
          onClick={() => alert('SAR audit report is being prepared in PDF format.')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150"
        >
          <Download className="h-4 w-4" />
          Download SAR PDF Report
        </button>
      </GlassCard>
    </div>
  );
}
