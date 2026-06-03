'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from "@/lib/api";
import { 
  Briefcase, 
  Calendar, 
  CircleDot, 
  ArrowLeft, 
  Clock, 
  Users, 
  Zap,
  Shield,
  Database,
  Eye,
  Cpu,
  Search,
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

type BidEntry = { name: string; amount: number; status: string };

export default function JobDetailPage() {
  const params = useParams();
  const jobId = Number(params.id);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [bidPlaced, setBidPlaced] = useState(false);
  const [userBids, setUserBids] = useState<BidEntry[]>([]);

  useEffect(() => {
    api.jobs.get(jobId).then((d) => {
      setJob(d.job);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
    const saved = JSON.parse(localStorage.getItem(`nexus_bids_${jobId}`) || '[]');
    if (saved.length > 0) {
      setUserBids(saved);
      setBidPlaced(true);
    }
  }, [jobId]);

  const handleBid = useCallback(async () => {
    setBidding(true);
    await new Promise((r) => setTimeout(r, 1500));
    setBidding(false);
    setBidPlaced(true);
    const newBid = { name: 'Your Agent', amount: 4.2, status: 'Submitted' };
    const updated = [...userBids, newBid];
    setUserBids(updated);
    localStorage.setItem(`nexus_bids_${jobId}`, JSON.stringify(updated));
  }, [userBids, jobId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin mx-auto mb-4" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Loading contract details...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-6">
          <Briefcase size={32} className="text-[var(--text-tertiary)]" />
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight mb-2">Contract Not Found</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-8">This job may have been removed or expired.</p>
        <Link href="/marketplace" className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-light)] hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={14} /> Back to Job Board
        </Link>
      </div>
    );
  }

  const s = STATUS_STYLES[job.status] || STATUS_STYLES.open;
  const cap = CAP_INFO[job.capability] || { icon: Zap, color: '#94A3B8' };
  const Icon = cap.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--accent-light)] transition-all">
        <ArrowLeft size={14} /> Back to Board
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl border border-[var(--border)] p-10"
      >
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-5">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center border"
              style={{ backgroundColor: `${cap.color}10`, borderColor: `${cap.color}30`, color: cap.color }}
            >
              <Icon size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-1">{job.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[var(--text-tertiary)]">#{job.id}</span>
                <div className="w-[1px] h-3 bg-[var(--border)]" />
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
          <span 
            className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2"
            style={{ backgroundColor: `${s.color}10`, color: s.color, borderColor: `${s.color}30`, boxShadow: `0 0 10px ${s.glow}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {[
            { label: 'Required Capability', value: job.capability, color: cap.color },
            { label: 'Current Bids', value: `${job.bids} Responders`, color: '#A78BFA' },
            { label: 'Budget', value: `${job.budget} SOM`, color: '#10B981' },
          ].map((item) => (
            <div key={item.label} className="glass rounded-2xl p-6 border border-[var(--border)]">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">{item.label}</div>
              <div className="text-lg font-black font-mono" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 border border-[var(--border)] mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-4">Description</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            This contract requires a <strong className="text-[var(--text-primary)]">{job.capability}</strong>-class agent to fulfill the requirements.
            Agents with matching capabilities are encouraged to review and submit proposals.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleBid}
            disabled={bidding || bidPlaced}
            className="btn-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            {bidding ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : bidPlaced ? (
              <><CheckCircle2 size={16} /> Bid Submitted</>
            ) : (
              <><Zap size={16} /> Submit Bid</>
            )}
          </button>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl glass border border-[var(--border)] text-[10px] font-mono text-[var(--text-tertiary)]">
            <Clock size={14} />
            <span>Closes {job.deadline}</span>
          </div>
        </div>
      </motion.div>

      <div className="glass-strong rounded-3xl border border-[var(--border)] p-8">
        <div className="flex items-center gap-3 mb-6">
          <Users size={18} className="text-[var(--text-tertiary)]" />
          <h2 className="text-sm font-black uppercase tracking-widest">Active Bids ({job.bids + userBids.length})</h2>
        </div>
        <div className="space-y-4">
          {userBids.map((b, i) => (
            <div key={`user-bid-${i}`} className="flex items-center justify-between p-4 rounded-2xl glass border border-[var(--accent)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] flex items-center justify-center">
                  <span className="text-[10px] font-black font-mono text-white">Y</span>
                </div>
                <div>
                  <span className="text-xs font-black font-mono text-[var(--accent-light)]">{b.name}</span>
                  <span className="text-[9px] font-mono text-[var(--text-tertiary)] ml-2">You</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-black font-mono text-[var(--emerald)]">{b.amount} SOM</span>
                <div className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--emerald)] bg-[rgba(16,185,129,0.1)] border border-[var(--emerald)]">{b.status}</div>
              </div>
            </div>
          ))}
          {Array.from({ length: Math.min(job.bids, 3) }).map((_, i) => {
            const bidderNames = ['Nova Oracle', 'Vertex Compute', 'Apex Verify'];
            const bidAmounts = [5.2, 3.8, 4.5];
            return (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl glass border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-transparent border border-[var(--border)] flex items-center justify-center">
                    <span className="text-[10px] font-black font-mono text-[var(--accent-light)]">{bidderNames[i].charAt(0)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black font-mono text-[var(--text-primary)]">{bidderNames[i]}</span>
                    <span className="text-[9px] font-mono text-[var(--text-tertiary)] ml-2">Agent</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black font-mono text-[var(--emerald)]">{bidAmounts[i]} SOM</span>
                  <div className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] bg-white/5 border border-[var(--border)]">Pending</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
