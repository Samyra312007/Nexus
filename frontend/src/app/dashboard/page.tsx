'use client';

import { useState, useEffect } from 'react';
import { AgentCard } from "@/components/AgentCard";
import { api } from "@/lib/api";
import type { Agent, Metrics } from "@/lib/types";

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.agents.list().then((d) => setAgents(d.agents)).catch(() => {});
    api.metrics().then(setMetrics).catch(() => {});
  }, []);

  const m = metrics || { activeAgents: 0, jobsCompleted: 0, totalVolume: '0', avgScore: 0, successRate: 0, jobsPerMinute: 0 };
  const vaults = [
    { agent: 'Alpha Oracle', balance: '45.2', spent: '12.3', limit: '5.0', reset: '~4h' },
    { agent: 'Beta Compute', balance: '28.7', spent: '3.1', limit: '5.0', reset: '~2h' },
    { agent: 'Gamma Parse', balance: '67.0', spent: '8.9', limit: '5.0', reset: '~6h' },
    { agent: 'Delta Verify', balance: '12.4', spent: '1.2', limit: '5.0', reset: '~1h' },
    { agent: 'Epsilon Monitor', balance: '8.1', spent: '0.5', limit: '5.0', reset: '~0h' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">COMMAND CENTER</h1>
        <p className="text-[#A0A3B1] text-sm">Manage your agents, vaults, and performance.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Your Agents', value: agents.length.toString(), color: '#6C5CE7' },
          { label: 'Total Earnings', value: `${m.totalVolume} SOM`, color: '#00B894' },
          { label: 'Jobs Completed', value: m.jobsCompleted.toLocaleString(), color: '#00D2D3' },
          { label: 'Avg Score', value: `${m.avgScore}%`, color: '#FDCB6E' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#12141A] border border-[#2D3148] rounded-lg p-4 text-center">
            <div className="text-[#636E72] text-sm mb-1">{stat.label}</div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} {...agent} />
        ))}
        {agents.length === 0 && (
          <div className="col-span-3 text-center text-[#636E72] py-12">No agents found. Deploy one!</div>
        )}
      </div>

      <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-5 mt-6">
        <h2 className="font-semibold mb-3">Vault Overview</h2>
        <div className="text-sm text-[#A0A3B1] space-y-2">
          {vaults.map((row) => (
            <div key={row.agent} className="flex items-center justify-between py-1.5 border-b border-[#2D3148] last:border-0">
              <span className="font-mono">{row.agent}</span>
              <div className="flex gap-6 font-mono">
                <span>{row.balance} SOM</span>
                <span style={{ color: Number(row.spent) > Number(row.limit) ? '#D63031' : '#A0A3B1' }}>Spent: {row.spent}</span>
                <span className="text-[#636E72]">Limit: {row.limit}</span>
                <span className="text-[#636E72]">Reset: {row.reset}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
