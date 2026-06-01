'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  ChevronRight, 
  BarChart3, 
  CheckCircle2, 
  XCircle,
  FileText,
  Users
} from "lucide-react";
import type { AuditRecord } from "@/lib/types";

export default function AuditLogPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  useEffect(() => {
    api.auditLog().then((d) => setAudits(d.audits)).catch(() => {});
  }, []);

  const passedCount = audits.filter((a) => a.passed).length;
  const avgScore = audits.length > 0 ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length) : 0;

  const stats = [
    { label: 'Total Audits', value: audits.length, color: '#3B82F6', icon: FileText },
    { label: 'Pass Rate', value: `${audits.length > 0 ? Math.round((passedCount / audits.length) * 100) : 0}%`, color: '#10B981', icon: CheckCircle2 },
    { label: 'Avg Trust Score', value: `${avgScore}%`, color: '#F59E0B', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl glass border border-[var(--border)]">
              <ShieldCheck size={20} className="text-[var(--accent-light)]" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Audit Log</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Immutable record of all agent performance audits and network consensus.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
            <input 
              type="text"
              placeholder="Search audit hash..."
              className="pl-12 pr-6 py-2.5 rounded-xl glass border border-[var(--border)] outline-none w-64 text-xs font-bold uppercase tracking-widest focus:border-[var(--accent-light)] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{stat.label}</div>
              <div className="text-2xl font-black font-mono tracking-tight" style={{ color: stat.color }}>{stat.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-strong rounded-3xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] bg-[rgba(255,255,255,0.02)]">
                <th className="px-8 py-5">Audit ID</th>
                <th className="px-6 py-5">Related Job</th>
                <th className="px-6 py-5">Quorum</th>
                <th className="px-6 py-5">Trust Score</th>
                <th className="px-6 py-5">Consensus</th>
                <th className="px-8 py-5 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {audits.map((record, idx) => {
                const scoreColor = record.score >= 70 ? 'var(--emerald)' : record.score >= 50 ? 'var(--amber)' : 'var(--rose)';
                const VerdictIcon = record.passed ? CheckCircle2 : XCircle;
                const verdictColor = record.passed ? 'var(--emerald)' : 'var(--rose)';

                return (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <span className="text-xs font-black font-mono text-[var(--text-secondary)]">#{record.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-[var(--accent-light)]">JOB-{record.jobId}</span>
                        <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-[var(--text-tertiary)]" />
                        <span className="text-xs font-black font-mono text-[var(--text-secondary)]">{record.validators} Nodes</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-black font-mono" style={{ color: scoreColor }}>{record.score}%</span>
                        <div className="w-16 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${record.score}%`, backgroundColor: scoreColor }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] bg-white/5 px-2 py-1 rounded-md border border-[var(--border)]">{record.consensus}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div 
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-opacity-20 transition-all"
                        style={{ backgroundColor: `${verdictColor}10`, color: verdictColor, borderColor: `${verdictColor}30` }}
                      >
                        <VerdictIcon size={12} />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">{record.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {audits.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-6">
              <FileText size={32} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">No Audit Records</h3>
            <p className="text-sm text-[var(--text-secondary)]">Transactions are being indexed, please stand by...</p>
          </div>
        )}
      </div>
    </div>
  );
}
