'use client';

import { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import type { AuditRecord } from "@/lib/types";

export default function AuditLogPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  useEffect(() => {
    api.auditLog().then((d) => setAudits(d.audits)).catch(() => {});
  }, []);

  const passed = audits.filter((a) => a.passed).length;
  const avgScore = audits.length > 0 ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">AUDIT LOG</h1>
        <p className="text-[#A0A3B1] text-sm">Every audit verdict recorded transparently on the blockchain.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-4 text-center">
          <div className="text-[#636E72] text-sm mb-1">Total Audits</div>
          <div className="text-2xl font-bold" style={{ color: '#74B9FF' }}>{audits.length}</div>
        </div>
        <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-4 text-center">
          <div className="text-[#636E72] text-sm mb-1">Pass Rate</div>
          <div className="text-2xl font-bold" style={{ color: '#00B894' }}>
            {audits.length > 0 ? Math.round((passed / audits.length) * 100) : 0}%
          </div>
        </div>
        <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-4 text-center">
          <div className="text-[#636E72] text-sm mb-1">Avg Score</div>
          <div className="text-2xl font-bold" style={{ color: '#FDCB6E' }}>{avgScore}</div>
        </div>
      </div>

      <div className="bg-[#12141A] border border-[#2D3148] rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-[#636E72] uppercase tracking-wider border-b border-[#2D3148]">
          <div className="col-span-2">Audit #</div>
          <div className="col-span-2">Job #</div>
          <div className="col-span-2">Validators</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2">Consensus</div>
          <div className="col-span-2">Verdict</div>
        </div>
        {audits.map((record) => (
          <div key={record.id} className="grid grid-cols-12 gap-4 px-5 py-3 text-sm border-b border-[#2D3148] hover:bg-[#1A1D26] transition-colors">
            <div className="col-span-2 font-mono">#{record.id}</div>
            <div className="col-span-2 font-mono" style={{ color: '#74B9FF' }}>#{record.jobId}</div>
            <div className="col-span-2 font-mono">{record.validators} agents</div>
            <div className="col-span-2 font-mono" style={{
              color: record.score >= 70 ? '#00B894' : record.score >= 50 ? '#FDCB6E' : '#D63031',
            }}>
              {record.score}/100
            </div>
            <div className="col-span-2 font-mono text-[#A0A3B1]">{record.consensus}</div>
            <div className="col-span-2">
              <span className="text-xs px-2 py-0.5 rounded font-mono" style={{
                backgroundColor: record.passed ? '#00B89422' : '#D6303122',
                color: record.passed ? '#00B894' : '#D63031',
              }}>
                {record.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        ))}
        {audits.length === 0 && (
          <div className="text-center text-[#636E72] py-12">No audit records yet.</div>
        )}
      </div>
    </div>
  );
}
