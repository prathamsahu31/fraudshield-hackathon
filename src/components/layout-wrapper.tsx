'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 cyber-grid">
      {/* Decorative cyber scan line effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-transparent via-cyber-cyan/15 to-transparent animate-scan" />

      {/* Sidebar navigation panel */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main dashboard content panel */}
      <div className="relative flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Header bar */}
        <Topbar setMobileOpen={setMobileOpen} />

        {/* Scrollable page body with Framer Motion page transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-950/20 via-zinc-950/70 to-black/80"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
