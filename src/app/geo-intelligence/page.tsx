'use client';

import React, { useState } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { geoAlertsMock, GeoAlert } from '@/lib/mockData';
import { 
  Globe, 
  Map, 
  Flag, 
  ShieldAlert, 
  Ban, 
  Sliders, 
  AlertTriangle,
  Locate
} from 'lucide-react';

export default function GeoIntelligencePage() {
  const [alerts, setAlerts] = useState<GeoAlert[]>(geoAlertsMock);
  const [selectedAlert, setSelectedAlert] = useState<GeoAlert | null>(geoAlertsMock[0]);

  // Geofence rules state
  const [geofences, setGeofences] = useState([
    { country: 'Sanctioned Jurisdictions (OFAC)', status: true, action: 'Block immediately', color: 'border-cyber-rose' },
    { country: 'High Risk LatAm & Eastern Europe', status: true, action: 'Step-up MFA > $2.5k', color: 'border-cyber-amber' },
    { country: 'Foreign Cash Out Withdrawal limit', status: false, action: 'Decline > $1k', color: 'border-zinc-800' },
  ]);

  const toggleGeofence = (idx: number) => {
    setGeofences(prev => prev.map((gf, i) => i === idx ? { ...gf, status: !gf.status } : gf));
  };

  const getActionBadge = (action: GeoAlert['actionTaken']) => {
    switch (action) {
      case 'Blocked': return 'text-cyber-rose bg-cyber-rose/10 border-cyber-rose/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
      case 'Challenged': return 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/30';
      default: return 'text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan">
          Geographic Fraud Intelligence
        </h1>
        <p className="text-sm text-zinc-400">
          Monitor velocity travel anomaly metrics, IP hops, and manage geofencing compliance rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Visual Map (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-0 overflow-hidden relative h-[450px] flex flex-col justify-between">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <span className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded border border-zinc-800 text-[10px] font-mono tracking-wider text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-cyber-rose animate-ping" />
                CRITICAL REGION
              </span>
            </div>

            {/* Stylized SVG Map Simulation */}
            <div className="flex-1 w-full bg-zinc-950/20 relative flex items-center justify-center">
              <svg 
                viewBox="0 0 1000 500" 
                className="w-full h-full stroke-zinc-900 fill-zinc-950"
              >
                {/* Simulated World Continents Paths */}
                <path d="M 150 150 Q 250 120 350 180 T 450 300 L 400 350 Z" className="fill-zinc-900/30 stroke-zinc-800/60" />
                <path d="M 500 120 Q 600 80 750 150 T 850 250 L 800 320 Z" className="fill-zinc-900/30 stroke-zinc-800/60" />
                <path d="M 220 350 Q 280 380 320 450 L 250 480 Z" className="fill-zinc-900/20 stroke-zinc-800/40" />
                <path d="M 680 320 Q 750 380 720 460 L 690 480 Z" className="fill-zinc-900/20 stroke-zinc-800/40" />
                
                {/* Geo Alert Pins */}
                {alerts.map((a) => {
                  const isSelected = selectedAlert?.id === a.id;
                  
                  // Map latitude/longitude to rough SVG coordinates (x: 100-900, y: 100-400)
                  // Let's use custom layout positions
                  const posMap: Record<string, {x: number, y: number}> = {
                    'GEO-001': { x: 500, y: 160 }, // Germany
                    'GEO-002': { x: 550, y: 220 }, // Cyprus
                    'GEO-003': { x: 420, y: 110 }, // Iceland
                    'GEO-004': { x: 620, y: 150 }, // Russia
                  };
                  const pos = posMap[a.id] || { x: 500, y: 200 };

                  return (
                    <g 
                      key={a.id}
                      onClick={() => setSelectedAlert(a)}
                      className="cursor-pointer group"
                    >
                      {/* Pulse Circle for High Risk */}
                      {a.riskScore >= 80 && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={18}
                          className="fill-none stroke-cyber-rose/40 stroke-2 animate-radar"
                        />
                      )}
                      
                      {/* Inner Pin */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 8 : 5}
                        className={`${
                          a.riskScore >= 80 ? 'fill-cyber-rose' : 'fill-cyber-amber'
                        } transition-all duration-200 group-hover:scale-125`}
                      />

                      {/* Info Overlay on Hover */}
                      <text
                        x={pos.x}
                        y={pos.y - 12}
                        className="fill-zinc-400 font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        textAnchor="middle"
                      >
                        {a.country} ({a.riskScore}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Panel Help */}
            <div className="p-4 border-t border-zinc-900/60 bg-zinc-950/60 flex items-center gap-2 text-xs text-zinc-400">
              <Locate className="h-4 w-4 text-cyber-cyan" />
              <span>Global telemetry log. Interactive pins map risk score severity of physical velocity coordinates anomalies.</span>
            </div>
          </GlassCard>

          {/* Impossible Velocity Alerts Table */}
          <GlassCard className="p-0 overflow-hidden">
            <GlassCardHeader 
              title="Telemetry Travel Velocity Alarms" 
              subtitle="Calculated triggers for logins occurring within physically impossible timelines"
              className="p-5"
            />
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    <th className="py-3 px-4">Alert ID / Time</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4 text-center">Risk Score</th>
                    <th className="py-3 px-4 text-center">Velocity Alarm</th>
                    <th className="py-3 px-4 text-right">System Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-xs">
                  {alerts.map((a) => {
                    const isSelected = selectedAlert?.id === a.id;
                    
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedAlert(a)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected ? 'bg-cyber-cyan/5 border-l-2 border-l-cyber-cyan' : 'hover:bg-zinc-900/20'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold block text-zinc-200">{a.id}</span>
                          <span className="text-[10px] text-zinc-500">{a.timestamp}</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-350 font-mono">{a.ipAddress}</td>
                        <td className="py-3 px-4 text-zinc-300 font-semibold">{a.country}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-zinc-200 font-mono">{a.riskScore}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            a.velocityMismatch 
                              ? 'bg-cyber-rose/10 border-cyber-rose/30 text-cyber-rose' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}>
                            {a.velocityMismatch ? 'CRITICAL' : 'SAFE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionBadge(a.actionTaken)}`}>
                            {a.actionTaken}
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

        {/* Right Column: Geofence Toggles & Telemetry inspector (1/3 width) */}
        <div className="space-y-6">
          
          {/* Geofence Policies */}
          <GlassCard>
            <GlassCardHeader 
              title="Geofence Controls" 
              subtitle="Active network border policy triggers"
            />
            
            <div className="space-y-4">
              {geofences.map((gf, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center p-3 rounded-lg border bg-zinc-950/40 text-xs transition-all duration-200 ${
                    gf.status ? gf.color : 'border-zinc-900'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <span className="font-bold text-zinc-200 block">{gf.country}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{gf.action}</span>
                  </div>
                  
                  {/* Switch */}
                  <button 
                    onClick={() => toggleGeofence(idx)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      gf.status ? 'bg-cyber-cyan' : 'bg-zinc-800'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      gf.status ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Telemetry Inspector */}
          {selectedAlert ? (
            <GlassCard glowColor={selectedAlert.riskScore >= 80 ? 'rose' : 'cyan'} className="space-y-4">
              <GlassCardHeader 
                title="Telemetry Inspector" 
                subtitle={`Registry tracking: ${selectedAlert.id}`}
              />

              <div className="space-y-3 p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Access Country:</span>
                  <span className="text-zinc-200 font-semibold">{selectedAlert.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">IP Host Address:</span>
                  <span className="text-zinc-300 font-mono">{selectedAlert.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Telemetry Target:</span>
                  <span className="text-zinc-300">{selectedAlert.deviceSignature}</span>
                </div>
              </div>

              {selectedAlert.velocityMismatch && (
                <div className="p-3 rounded border border-cyber-rose/25 bg-cyber-rose/5 text-xs text-cyber-rose flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Impossible Travel Detected:</strong> Login registered from coordinate [{selectedAlert.lat}, {selectedAlert.lng}] 15 minutes after a cleared localized login transaction. Exceeds standard commercial travel threshold speed limits.
                  </p>
                </div>
              )}

              <div className="border-t border-zinc-900 pt-4">
                <button
                  onClick={() => alert(`Blacklisting IP endpoint ${selectedAlert.ipAddress} and restricting account access.`)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-cyber-rose/15 border border-cyber-rose/35 text-cyber-rose hover:bg-cyber-rose/25 transition-all duration-150 animate-pulse"
                >
                  <Ban className="h-4 w-4" />
                  Blacklist IP & Restrict Access
                </button>
              </div>

            </GlassCard>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              <Globe className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="font-semibold text-sm">Select record</p>
              <p className="text-xs">Click a travel alert in the registry to evaluate geographical velocity vectors.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
