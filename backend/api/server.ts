import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// ── Demo data ──────────────────────────────────────────────────────────

const AGENTS = [
  { id: 1, owner: '0xAlice', name: 'Alpha Oracle', capability: 'oracle', reputation: 7200, stake: '10.0', jobsDone: 142, status: 'active' as const },
  { id: 2, owner: '0xBob', name: 'Beta Compute', capability: 'computation', reputation: 5400, stake: '10.0', jobsDone: 87, status: 'busy' as const },
  { id: 3, owner: '0xCharlie', name: 'Gamma Parse', capability: 'data-parse', reputation: 8900, stake: '15.5', jobsDone: 231, status: 'active' as const },
  { id: 4, owner: '0xAlice', name: 'Delta Verify', capability: 'verification', reputation: 6200, stake: '10.0', jobsDone: 56, status: 'idle' as const },
  { id: 5, owner: '0xBob', name: 'Epsilon Monitor', capability: 'monitor', reputation: 4800, stake: '10.0', jobsDone: 34, status: 'active' as const },
];

const JOBS = [
  { id: 1195, title: 'Aggregate token prices across 5 DEXes', budget: '0.5 SOM', capability: 'oracle', bids: 3, deadline: '0:52', status: 'open' as const },
  { id: 1194, title: 'Compute rolling volatility for SOM/ETH', budget: '1.2 SOM', capability: 'computation', bids: 7, deadline: '2:14', status: 'open' as const },
  { id: 1193, title: 'Parse onchain governance proposals', budget: '0.8 SOM', capability: 'data-parse', bids: 2, deadline: '4:30', status: 'auditing' as const },
  { id: 1192, title: 'Verify cross-chain message proof', budget: '2.0 SOM', capability: 'verification', bids: 5, deadline: '1:05', status: 'completed' as const },
  { id: 1191, title: 'Monitor liquidity pool depths', budget: '0.3 SOM/block', capability: 'monitor', bids: 1, deadline: '0:12', status: 'open' as const },
];

const VAULTS = [
  { agent: 'Alpha Oracle', balance: '45.2', spent: '12.3', limit: '5.0', reset: '~4h' },
  { agent: 'Beta Compute', balance: '28.7', spent: '3.1', limit: '5.0', reset: '~2h' },
  { agent: 'Gamma Parse', balance: '67.0', spent: '8.9', limit: '5.0', reset: '~6h' },
  { agent: 'Delta Verify', balance: '12.4', spent: '1.2', limit: '5.0', reset: '~1h' },
  { agent: 'Epsilon Monitor', balance: '8.1', spent: '0.5', limit: '5.0', reset: '~0h' },
];

const AUDITS = [
  { id: 1201, jobId: 1193, validators: 5, score: 78, passed: true, time: '0:12 ago', consensus: '4/5' },
  { id: 1200, jobId: 1192, validators: 7, score: 91, passed: true, time: '2:04 ago', consensus: '6/7' },
  { id: 1199, jobId: 1191, validators: 3, score: 45, passed: false, time: '5:30 ago', consensus: '2/3' },
  { id: 1198, jobId: 1190, validators: 5, score: 82, passed: true, time: '8:15 ago', consensus: '4/5' },
  { id: 1197, jobId: 1189, validators: 6, score: 67, passed: true, time: '12:00 ago', consensus: '4/6' },
  { id: 1196, jobId: 1188, validators: 4, score: 33, passed: false, time: '18:22 ago', consensus: '1/4' },
];

// ── Routes ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexus-api', timestamp: new Date().toISOString() });
});

app.get('/api/agents', async (_req, res) => {
  res.json({ agents: AGENTS, total: AGENTS.length });
});

app.get('/api/agents/:id', async (req, res) => {
  const agent = AGENTS.find((a) => a.id === Number(req.params.id)) || null;
  res.json({ agent });
});

app.get('/api/jobs', async (_req, res) => {
  res.json({ jobs: JOBS, total: JOBS.length });
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = JOBS.find((j) => j.id === Number(req.params.id)) || null;
  res.json({ job });
});

app.get('/api/metrics', async (_req, res) => {
  const successRate = AGENTS.reduce((s, a) => s + a.jobsDone, 0);
  const totalJobs = successRate + AGENTS.reduce((s, a) => s + Math.round(a.jobsDone * 0.1), 0);
  res.json({
    activeAgents: AGENTS.filter((a) => a.status !== 'idle').length,
    jobsCompleted: successRate,
    totalVolume: `${(successRate * 0.35).toFixed(0)}`,
    avgScore: Math.round(AUDITS.reduce((s, a) => s + a.score, 0) / AUDITS.length),
    successRate: Math.round((AUDITS.filter((a) => a.passed).length / AUDITS.length) * 100),
    jobsPerMinute: 312,
  });
});

app.get('/api/audit-log', async (_req, res) => {
  res.json({ audits: AUDITS, total: AUDITS.length });
});

app.get('/api/feed', async (_req, res) => {
  const events = [
    { type: 'completed', jobId: 1192, agentId: 31, score: 91, amount: '0.08', time: '2s ago', timestamp: new Date().toISOString() },
    { type: 'bid', jobId: 1194, agentId: 12, capability: 'oracle', time: '3s ago', timestamp: new Date().toISOString() },
    { type: 'spawn', agentId: 7, childId: 89, amount: '4.1', time: '5s ago', timestamp: new Date().toISOString() },
    { type: 'posted', jobId: 1195, budget: '0.5', bids: 3, time: '7s ago', timestamp: new Date().toISOString() },
    { type: 'audit', jobId: 1193, responders: 5, total: 7, time: '8s ago', timestamp: new Date().toISOString() },
    { type: 'passed', jobId: 1193, score: 78, time: '12s ago', timestamp: new Date().toISOString() },
  ];
  res.json({ events });
});

app.listen(PORT, () => {
  console.log(`[API] NEXUS API server on http://localhost:${PORT}`);
});
