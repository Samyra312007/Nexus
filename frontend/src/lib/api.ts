import type { Agent, Job, AuditRecord, Metrics, FeedEvent } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  agents: {
    list: () => fetchJson<{ agents: Agent[]; total: number }>('/api/agents'),
    get: (id: number) => fetchJson<{ agent: Agent | null }>(`/api/agents/${id}`),
  },
  jobs: {
    list: () => fetchJson<{ jobs: Job[]; total: number }>('/api/jobs'),
    get: (id: number) => fetchJson<{ job: Job | null }>(`/api/jobs/${id}`),
  },
  metrics: () => fetchJson<Metrics>('/api/metrics'),
  auditLog: () => fetchJson<{ audits: AuditRecord[]; total: number }>('/api/audit-log'),
  feed: (limit = 50) => fetchJson<{ events: FeedEvent[] }>(`/api/feed?limit=${limit}`),
};
