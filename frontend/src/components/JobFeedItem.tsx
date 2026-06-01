'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Zap, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

const ICONS: Record<string, any> = {
  completed: CheckCircle2,
  bid: ArrowRight,
  spawn: Plus,
  posted: Zap,
  audit: ShieldCheck,
  passed: CheckCircle2,
};

const COLORS: Record<string, string> = {
  completed: '#10B981', 
  bid: '#06B6D4', 
  spawn: '#A78BFA',
  posted: '#F59E0B', 
  audit: '#3B82F6', 
  passed: '#10B981',
};

type EventProps = {
  type: string;
  jobId?: number;
  agentId?: number;
  childId?: number;
  score?: number;
  amount?: string;
  capability?: string;
  budget?: string;
  bids?: number;
  responders?: number;
  total?: number;
  time: string;
  index: number;
};

export function JobFeedItem(props: EventProps) {
  const { type, jobId, agentId, childId, score, amount, capability, budget, bids, responders, total, time, index } = props;
  const Icon = ICONS[type] || Zap;
  const color = COLORS[type] || '#475569';

  const getMessage = () => {
    switch (type) {
      case 'completed':
        return `Agent #${String(agentId).padStart(4, '0')} completed Job #${jobId}`;
      case 'bid':
        return `Agent #${String(agentId).padStart(4, '0')} bidding on Job #${jobId}`;
      case 'spawn':
        return `Agent #${String(agentId).padStart(4, '0')} spawned child #${String(childId).padStart(4, '0')}`;
      case 'posted':
        return `Job #${jobId} posted — ${budget} SOM`;
      case 'audit':
        return `Audit requested for Job #${jobId}`;
      case 'passed':
        return `Job #${jobId} audit passed — Score ${score}`;
      default:
        return '';
    }
  };

  const getDetail = () => {
    switch (type) {
      case 'completed': return `Performance: ${score}% · Reward: +${amount} SOM`;
      case 'bid': return `Specialization: ${capability}`;
      case 'spawn': return `Neural lineage extended`;
      case 'posted': return `High priority · ${bids} active bids`;
      case 'audit': return `Validation quorum: ${responders}/${total}`;
      case 'passed': return `Onchain settlement released`;
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-[rgba(255,255,255,0.02)] transition-all group border border-transparent hover:border-[var(--border)]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-opacity-10 group-hover:scale-110 transition-transform duration-300"
        style={{ 
          backgroundColor: `${color}10`, 
          borderColor: `${color}30`,
          boxShadow: `0 0 15px ${color}10`
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
            {getMessage()}
          </span>
          <span 
            className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-opacity-20"
            style={{ color, borderColor: color, backgroundColor: `${color}05` }}
          >
            {type}
          </span>
        </div>
        <div className="text-[11px] font-medium text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
          {getDetail()}
        </div>
      </div>
      
      <div className="flex flex-col items-end shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-tertiary)]">
          <Clock size={10} />
          {time}
        </div>
      </div>
    </motion.div>
  );
}
