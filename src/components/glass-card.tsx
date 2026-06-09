import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  glowColor?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'none';
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  glowColor = 'none',
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  const glowClasses = {
    none: '',
    cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.15)] border-cyber-cyan/30',
    rose: 'shadow-[0_0_20px_rgba(244,63,94,0.15)] border-cyber-rose/30',
    amber: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] border-cyber-amber/30',
    emerald: 'shadow-[0_0_20px_rgba(16,185,129,0.15)] border-cyber-emerald/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hoverEffect ? { scale: 1.015, transition: { duration: 0.2 } } : {}}
      className={cn(
        'glass-panel rounded-xl p-5 border transition-colors duration-300',
        hoverEffect ? (glowColor === 'rose' ? 'glass-panel-red-hover' : 'glass-panel-hover') : '',
        glowClasses[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function GlassCardHeader({
  title,
  subtitle,
  action,
  className,
  ...props
}: GlassCardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/60', className)} {...props}>
      <div>
        <h3 className="font-semibold text-lg text-zinc-100 tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
