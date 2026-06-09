import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatRiskScore(score: number): { text: string; color: string; bg: string; border: string; glow: string } {
  if (score >= 80) {
    return {
      text: 'Critical',
      color: 'text-cyber-rose',
      bg: 'bg-cyber-rose/10',
      border: 'border-cyber-rose/30',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    };
  } else if (score >= 50) {
    return {
      text: 'High Risk',
      color: 'text-cyber-amber',
      bg: 'bg-cyber-amber/10',
      border: 'border-cyber-amber/30',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    };
  } else if (score >= 25) {
    return {
      text: 'Medium Risk',
      color: 'text-cyber-blue',
      bg: 'bg-cyber-blue/10',
      border: 'border-cyber-blue/30',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    };
  } else {
    return {
      text: 'Low Risk',
      color: 'text-cyber-emerald',
      bg: 'bg-cyber-emerald/10',
      border: 'border-cyber-emerald/30',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    };
  }
}
