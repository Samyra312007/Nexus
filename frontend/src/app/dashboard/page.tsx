'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AgentCard } from "@/components/AgentCard";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { 
  Users, 
  Banknote, 
  CheckSquare, 
  Star, 
  Terminal, 
  Wallet, 
  History,
  LayoutGrid,
  BarChart2
} from "lucide-react";
import type { Agent, Metrics } from "@/lib/types";

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const agentGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.agents.list().then((d) => {
      const local = JSON.parse(localStorage.getItem('nexus_agents') || '[]');
      const merged = [...local, ...d.agents.filter((a) => !local.some((l: any) => l.id === a.id))];
      setAgents(merged);
    }).catch(() => {
      const local = JSON.parse(localStorage.getItem('nexus_agents') || '[]');
      setAgents(local);
    });
    api.metrics().then(setMetrics).catch(() => {});
  }, []);

  const m = metrics || { activeAgents: 0, jobsCompleted: 0, totalVolume: '0', avgScore: 0, successRate: 0, jobsPerMinute: 0 };

  const stats = [
    { label: 'Active Nodes', value: agents.length.toString(), color: '#A78BFA', icon: Users },
    { label: 'Yield Accrued', value: `${m.totalVolume} SOM`, color: '#10B981', icon: Banknote },
    { label: 'Success Ops', value: m.jobsCompleted.toLocaleString(), color: '#06B6D4', icon: CheckSquare },
    { label: 'Trust Rating', value: `${m.avgScore}%`, color: '#F59E0B', icon: Star },
  ];

  const vaults = [
    { agent: 'Alpha Oracle', balance: '45.2', spent: '12.3', limit: '5.0', reset: '~4h', cap: '#A78BFA' },
    { agent: 'Beta Compute', balance: '28.7', spent: '3.1', limit: '5.0', reset: '~2h', cap: '#06B6D4' },
    { agent: 'Gamma Parse', balance: '67.0', spent: '8.9', limit: '5.0', reset: '~6h', cap: '#10B981' },
    { agent: 'Delta Verify', balance: '12.4', spent: '1.2', limit: '5.0', reset: '~1h', cap: '#F59E0B' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl glass border border-[var(--border)]">
              <Terminal size={20} className="text-[var(--accent-light)]" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Command Center</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Control and monitor your autonomous workforce and capital flow.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl glass border border-[var(--border)] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--emerald)] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Syncing Mainnet</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-strong p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--border-bright)] transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-2 rounded-lg transition-all"
                  style={{ backgroundColor: `${stat.color}10`, color: stat.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="text-[10px] font-black font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Live Updates</div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{stat.label}</div>
              <div className="text-2xl font-black font-mono tracking-tight" style={{ color: stat.color }}>{stat.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-[var(--text-tertiary)]" />
            <h2 className="text-sm font-black uppercase tracking-widest">Active Agent Clusters</h2>
          </div>
          <button
            onClick={() => {
              agentGridRef.current?.scrollIntoView({ behavior: 'smooth' });
              setPulseKey((k) => k + 1);
            }}
            className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-light)] hover:underline"
          >
            Manage All
          </button>
        </div>
        
        <div
          ref={agentGridRef}
          key={pulseKey}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse-border"
          style={{ animation: pulseKey > 0 ? 'pulseBorder 0.6s ease-out' : 'none' }}
        >
          {agents.map((agent) => (
            <AgentCard key={agent.id} {...agent} />
          ))}
          {agents.length === 0 && (
            <div className="col-span-full py-20 rounded-3xl glass-strong border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-6">
                <Users size={32} className="text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">No Agents Operational</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-8">You haven't deployed any agents yet.</p>
              <Link href="/deploy" className="btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-tight inline-block">Deploy First Agent</Link>
            </div>
          )}
        </div>
      </div>

      <div className="glass-strong rounded-3xl border border-[var(--border)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[rgba(16,185,129,0.05)] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass border border-[rgba(16,185,129,0.2)] flex items-center justify-center">
              <Wallet size={20} className="text-[var(--emerald)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Escrow Vaults</h3>
              <p className="text-[10px] text-[var(--text-tertiary)] font-mono">Real-time capital allocation</p>
            </div>
          </div>
          <Link
            href="/audit-log"
            className="p-2 rounded-lg hover:bg-white/5 transition-all text-[var(--text-tertiary)]"
          >
            <History size={18} />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] bg-[rgba(255,255,255,0.02)]">
                <th className="px-8 py-4">Agent Identifier</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Utilization</th>
                <th className="px-6 py-4">Withdraw Limit</th>
                <th className="px-6 py-4">Next Reset</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {vaults.map((row) => (
                <tr key={row.agent} className="group hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.cap }} />
                      <span className="text-xs font-black font-mono tracking-tight">{row.agent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black font-mono text-[var(--emerald)]">{row.balance} SOM</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${(Number(row.spent) / Number(row.limit)) * 100}%`,
                          backgroundColor: Number(row.spent) > Number(row.limit) ? 'var(--rose)' : 'var(--accent)'
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black font-mono text-[var(--text-secondary)]">{row.limit} SOM</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black font-mono text-[var(--text-tertiary)]">{row.reset}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg glass border border-[var(--border)] group-hover:border-[var(--emerald)] transition-all">
                      <div className="w-1 h-1 rounded-full bg-[var(--emerald)]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--emerald)]">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
