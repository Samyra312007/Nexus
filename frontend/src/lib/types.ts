export interface Agent {
  id: number;
  owner: string;
  name: string;
  capability: string;
  reputation: number;
  stake: string;
  jobsDone: number;
  status: 'active' | 'busy' | 'idle' | 'slashed';
}

export interface Job {
  id: number;
  title: string;
  budget: string;
  capability: string;
  bids: number;
  deadline: string;
  status: 'open' | 'auditing' | 'completed' | 'failed';
}

export interface AuditRecord {
  id: number;
  jobId: number;
  validators: number;
  score: number;
  passed: boolean;
  time: string;
  consensus: string;
}

export interface Metrics {
  activeAgents: number;
  jobsCompleted: number;
  totalVolume: string;
  avgScore: number;
  successRate: number;
  jobsPerMinute: number;
}

export interface VaultEntry {
  agent: string;
  balance: string;
  spent: string;
  limit: string;
  reset: string;
}

export type FeedEvent = {
  type: 'completed' | 'bid' | 'spawn' | 'posted' | 'audit' | 'passed';
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
  timestamp: string;
};
