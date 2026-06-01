'use client';

import { ReputationBar } from "./ReputationBar";
import { motion } from "framer-motion";
import { 
  Shield, 
  Cpu, 
  Database, 
  Eye, 
  Search,
  Activity,
  Award
} from "lucide-react";

type AgentCardProps = {
  id: number;
  name: string;
  capability: string;
  reputation: number;
  stake: string;
  jobsDone: number;
  status: 'active' | 'busy' | 'idle' | 'slashed';
};

const STATUS_STYLES = {
  active: { color: '#10B981', glow: 'rgba(16, 185, 129, 0.2)' },
  busy: { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.2)' },
  idle: { color: '#64748B', glow: 'rgba(100, 116, 139, 0.1)' },
  slashed: { color: '#EF4444', glow: 'rgba(239, 68, 68, 0.2)' },
};

const CAP_INFO: Record<string, { icon: any, color: string }> = {
  oracle: { icon: Eye, color: '#A78BFA' },
  computation: { icon: Cpu, color: '#06B6D4' },
  'data-parse': { icon: Database, color: '#10B981' },
  verification: { icon: Shield, color: '#F59E0B' },
  monitor: { icon: Search, color: '#3B82F6' },
};

export function AgentCard({ id, name, capability, reputation, stake, jobsDone, status }: AgentCardProps) {
  const s = STATUS_STYLES[status];
  const cap = CAP_INFO[capability] || { icon: Activity, color: '#94A3B8' };
  const Icon = cap.icon;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-strong rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--border-bright)] transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--accent)] to-transparent opacity-[0.02] blur-2xl rounded-full" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border border-opacity-20 shadow-inner group-hover:rotate-6 transition-transform duration-500"
            style={{ 
              background: `linear-gradient(135deg, ${cap.color}15, ${cap.color}05)`, 
              borderColor: `${cap.color}40`,
              color: cap.color 
            }}
          >
            <Icon size={24} />
          </div>
          <div>
            <div className="font-black text-base tracking-tight uppercase">{name}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-tertiary)]">ID: {String(id).padStart(4, '0')}</div>
          </div>
        </div>
        
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-opacity-20"
          style={{ 
            backgroundColor: `${s.color}10`, 
            color: s.color, 
            borderColor: `${s.color}30`,
            boxShadow: `0 0 10px ${s.glow}`
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
          {status}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            <Award size={12} className="text-[var(--accent-light)]" />
            Reputation
          </div>
          <span className="text-xs font-black font-mono text-[var(--accent-light)]">{reputation}%</span>
        </div>
        <ReputationBar score={reputation} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Stake Pool</span>
          <span className="text-xs font-black font-mono text-[var(--text-primary)]">{stake} <span className="text-[10px] text-[var(--text-tertiary)]">SOM</span></span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Executions</span>
          <span className="text-xs font-black font-mono text-[var(--text-primary)]">{jobsDone}</span>
        </div>
      </div>

      <div className="mt-4">
        <span 
          className="inline-block text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-[var(--border)] group-hover:border-[var(--accent)] transition-all"
          style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }}
        >
          {capability}
        </span>
      </div>
    </motion.div>
  );
}
