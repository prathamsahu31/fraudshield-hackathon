'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ArrowLeftRight, 
  Network, 
  Shuffle, 
  FolderKanban, 
  MessageSquareCode, 
  Globe, 
  BarChart3, 
  Cpu,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Mule Networks', href: '/mule-networks', icon: Network },
    { name: 'Money Flow', href: '/money-flow', icon: Shuffle },
    { name: 'Investigations', href: '/investigations', icon: FolderKanban },
    { name: 'Complaints', href: '/complaints', icon: MessageSquareCode },
    { name: 'Geo Intelligence', href: '/geo-intelligence', icon: Globe },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Simulation', href: '/simulation', icon: Cpu },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 lg:static",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-900">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <ShieldAlert className="h-5.5 w-5.5 animate-pulse-slow" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-wider text-glow-cyan text-zinc-100">
                FRAUD<span className="text-cyber-cyan">SHIELD</span>
              </span>
            )}
          </Link>
          
          <button 
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative group flex items-center gap-3.5 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors duration-200",
                  isActive 
                    ? "text-cyber-cyan"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-highlight"
                    className="absolute inset-0 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <Icon className={cn(
                  "relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-cyber-cyan" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                {!collapsed && (
                  <span className="relative z-10 truncate tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Collapse Toggle (Desktop only) */}
        <div className="hidden lg:flex p-4 border-t border-zinc-900 justify-end">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent hover:border-zinc-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
