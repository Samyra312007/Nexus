'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from "@/lib/api";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight, 
  CircleDot,
  Zap,
  Shield,
  Database,
  Eye,
  Cpu,
  CheckCircle2
} from "lucide-react";
import type { Job } from "@/lib/types";

const STATUS_STYLES: Record<string, { color: string; glow: string }> = {
  open: { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.2)' },
  auditing: { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.2)' },
  completed: { color: '#10B981', glow: 'rgba(16, 185, 129, 0.2)' },
  failed: { color: '#EF4444', glow: 'rgba(239, 68, 68, 0.2)' },
};

const CAP_INFO: Record<string, { icon: any, color: string }> = {
  oracle: { icon: Eye, color: '#A78BFA' },
  computation: { icon: Cpu, color: '#06B6D4' },
  'data-parse': { icon: Database, color: '#10B981' },
  verification: { icon: Shield, color: '#F59E0B' },
  monitor: { icon: Search, color: '#3B82F6' },
};

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [userBidCounts, setUserBidCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    api.jobs.list().then((d) => setJobs(d.jobs)).catch(() => {});
    const counts: Record<number, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('nexus_bids_')) {
        const jobId = Number(key.replace('nexus_bids_', ''));
        const bids = JSON.parse(localStorage.getItem(key) || '[]');
        counts[jobId] = bids.length;
      }
    }
    setUserBidCounts(counts);
  }, []);

  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
      j.capability.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? j.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl glass border border-[var(--border)]">
              <Briefcase size={20} className="text-[var(--accent-light)]" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Job Board</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Browse and bid on active computational contracts within the network.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-light)] transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Filter by capability or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 rounded-2xl glass border border-[var(--border)] focus:border-[var(--accent-light)] outline-none w-64 text-sm font-medium transition-all"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="p-3 rounded-2xl glass border border-[var(--border)] hover:border-[var(--accent-light)] transition-all text-[var(--text-secondary)] hover:text-[var(--accent-light)]"
            >
              <Filter size={18} />
            </button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-40 glass-strong rounded-2xl border border-[var(--border-bright)] p-2 shadow-2xl z-50">
                <button
                  onClick={() => { setStatusFilter(null); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!statusFilter ? 'text-[var(--accent-light)] bg-[rgba(124,58,237,0.1)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                >
                  All Statuses
                </button>
                {Object.keys(STATUS_STYLES).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'text-[var(--accent-light)] bg-[rgba(124,58,237,0.1)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
        {Object.entries(STATUS_STYLES).map(([status, s]) => (
          <button 
            key={status} 
            onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl glass border transition-all shrink-0 ${
              statusFilter === status ? 'border-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--border-bright)]'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.glow}` }} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{status}</span>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] bg-white/5 px-1.5 rounded-md">
              {jobs.filter(j => j.status === status).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredJobs.map((job, idx) => {
          const s = STATUS_STYLES[job.status] || STATUS_STYLES.open;
          const cap = CAP_INFO[job.capability] || { icon: Zap, color: '#94A3B8' };
          const Icon = cap.icon;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={`/marketplace/${job.id}`}
                className="glass-strong rounded-2xl p-1 border border-[var(--border)] hover:border-[var(--border-bright)] transition-all group overflow-hidden block"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-opacity-20"
                        style={{ backgroundColor: `${cap.color}10`, borderColor: `${cap.color}30`, color: cap.color }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black uppercase tracking-tight text-sm truncate">{job.title}</h3>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">#{job.id}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5">
                            <CircleDot size={10} className="text-[var(--emerald)]" />
                            <span className="text-[10px] font-black font-mono text-[var(--emerald)] uppercase tracking-tight">{job.budget} SOM</span>
                          </div>
                          <div className="w-[1px] h-3 bg-[var(--border)]" />
                          <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                            <Calendar size={10} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{job.deadline}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 md:gap-12">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-1">Requirement</span>
                      <span 
                        className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-opacity-20"
                        style={{ color: cap.color, borderColor: `${cap.color}40`, backgroundColor: `${cap.color}05` }}
                      >
                        {job.capability}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-1">Response</span>
                      <span className="text-xs font-black font-mono text-[var(--text-primary)]">
                        {job.bids + (userBidCounts[job.id] || 0)} Bids
                        {userBidCounts[job.id] ? <span className="text-[var(--emerald)] ml-1">(+{userBidCounts[job.id]})</span> : ''}
                      </span>
                    </div>

                    <div className="flex flex-col items-end min-w-[100px]">
                      <span 
                        className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-opacity-20 flex items-center gap-2"
                        style={{ backgroundColor: `${s.color}10`, color: s.color, borderColor: `${s.color}30`, boxShadow: `0 0 10px ${s.glow}` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {job.status}
                      </span>
                      {userBidCounts[job.id] ? (
                        <span className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--emerald)] flex items-center gap-1">
                          <CheckCircle2 size={10} /> Bid Placed
                        </span>
                      ) : ''}
                    </div>

                    <div className="p-2 rounded-xl text-[var(--text-tertiary)] group-hover:text-[var(--accent-light)] group-hover:translate-x-1 transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="py-24 rounded-3xl glass-strong border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-6">
              <Search size={32} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">No Contracts Found</h3>
            <p className="text-sm text-[var(--text-secondary)]">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
