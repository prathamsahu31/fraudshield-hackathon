'use client';

import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Activity, 
  ShieldAlert, 
  Terminal, 
  UserCheck 
} from 'lucide-react';
import { systemStatus } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export function Topbar({ setMobileOpen }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    { id: '1', title: 'Critical Velocity Alarm', time: '5m ago', desc: 'Sarah Jenkins login mismatch.' },
    { id: '2', title: 'Mule Ring Detected', time: '12m ago', desc: 'Apex Digital LLC transactions spike.' },
    { id: '3', title: 'Sanctions Threat Triggered', time: '1h ago', desc: 'TXN-9024 blocked route.' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-6">
      {/* Left side - Search and Mobile Toggle */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Simulated Search bar */}
        <div className="relative max-w-md hidden md:block w-full">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search transactions, accounts, entity nodes..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 py-1.5 pr-4 pl-9 text-sm text-zinc-200 placeholder-zinc-500 focus:border-cyber-cyan/60 focus:bg-zinc-900/80 focus:ring-1 focus:ring-cyber-cyan/50 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Right side - Metrics and Notifications */}
      <div className="flex items-center gap-6">
        {/* Threat Level Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            THREAT LEVEL: DEFCON 3
          </span>
        </div>

        {/* Live System Sync */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
          </span>
          <span className="font-mono tracking-widest uppercase">SYS-SYNC: SECURE</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors duration-150"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-cyber-rose"></span>
          </button>

          {showNotifications && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              
              <div className="absolute right-0 mt-3.5 w-80 z-50 rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                  <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-cyber-cyan" />
                    Threat Feed
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">3 UNREAD ALERTS</span>
                </div>
                <div className="space-y-3">
                  {mockNotifications.map((n) => (
                    <div 
                      key={n.id} 
                      className="group rounded-lg p-2.5 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800/80 transition-all duration-150"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-zinc-200">{n.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{n.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-zinc-900 pt-2.5 text-center">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-cyber-cyan hover:underline font-medium"
                  >
                    Close Terminal Panel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User profile dropdown simulation */}
        <div className="flex items-center gap-2.5 border-l border-zinc-800/80 pl-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <UserCheck className="h-4 w-4 text-cyber-cyan" />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-zinc-200">SecOps Agent</p>
            <p className="text-[10px] text-zinc-500 font-mono">RISK-LEAD-07</p>
          </div>
        </div>
      </div>
    </header>
  );
}
