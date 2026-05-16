import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// ── PostgreSQL (optional — falls back to demo data) ─────────────────────

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false })
  : null;

async function query(text: string, params?: any[]) {
  if (!pool) return null;
  try { return await pool.query(text, params); } catch (e) { console.error('[DB] query error:', e); return null; }
}

// ── Demo data (fallback) ────────────────────────────────────────────────

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

const AUDITS = [
  { id: 1201, jobId: 1193, validators: 5, score: 78, passed: true, time: '0:12 ago', consensus: '4/5' },
  { id: 1200, jobId: 1192, validators: 7, score: 91, passed: true, time: '2:04 ago', consensus: '6/7' },
  { id: 1199, jobId: 1191, validators: 3, score: 45, passed: false, time: '5:30 ago', consensus: '2/3' },
  { id: 1198, jobId: 1190, validators: 5, score: 82, passed: true, time: '8:15 ago', consensus: '4/5' },
  { id: 1197, jobId: 1189, validators: 6, score: 67, passed: true, time: '12:00 ago', consensus: '4/6' },
  { id: 1196, jobId: 1188, validators: 4, score: 33, passed: false, time: '18:22 ago', consensus: '1/4' },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function getAgentsDemo() { return AGENTS; }
function getJobsDemo() { return JOBS; }

async function getAgentsFromDb() {
  const r = await query('SELECT id, owner_address AS owner, name, reputation_score AS reputation, staked_amount_wei::TEXT AS stake, completed_jobs AS "jobsDone", is_active AS status FROM agents ORDER BY id');
  return r?.rows ?? null;
}

async function getJobsFromDb() {
  const r = await query("SELECT id, required_capability, budget_wei::TEXT AS budget, status, quality_threshold FROM jobs ORDER BY id DESC LIMIT 50");
  return r?.rows ?? null;
}

// ── Routes ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexus-api', database: pool ? 'connected' : 'demo', timestamp: new Date().toISOString() });
});

app.get('/api/agents', async (_req, res) => {
  const db = await getAgentsFromDb();
  if (db) return res.json({ agents: db, total: db.length });
  res.json({ agents: AGENTS, total: AGENTS.length });
});

app.get('/api/agents/:id', async (req, res) => {
  if (pool) {
    const r = await query('SELECT id, owner_address AS owner, name, reputation_score AS reputation, staked_amount_wei::TEXT AS stake, completed_jobs AS "jobsDone", CASE WHEN is_active THEN \'active\' ELSE \'slashed\' END AS status FROM agents WHERE id = $1', [req.params.id]);
    if (r?.rows?.[0]) return res.json({ agent: r.rows[0] });
  }
  const agent = AGENTS.find((a) => a.id === Number(req.params.id)) || null;
  res.json({ agent });
});

app.get('/api/jobs', async (_req, res) => {
  const db = await getJobsFromDb();
  if (db) return res.json({ jobs: db, total: db.length });
  res.json({ jobs: JOBS, total: JOBS.length });
});

app.get('/api/jobs/:id', async (req, res) => {
  if (pool) {
    const r = await query('SELECT id, task_payload_ipfs, budget_wei::TEXT AS budget, quality_threshold, status FROM jobs WHERE id = $1', [req.params.id]);
    if (r?.rows?.[0]) return res.json({ job: r.rows[0] });
  }
  const job = JOBS.find((j) => j.id === Number(req.params.id)) || null;
  res.json({ job });
});

app.get('/api/metrics', async (_req, res) => {
  if (pool) {
    const [a, j, avg] = await Promise.all([
      query("SELECT COUNT(*)::int AS active FROM agents WHERE is_active = true"),
      query("SELECT COUNT(*)::int AS completed FROM jobs WHERE status = 'completed'"),
      query("SELECT COALESCE(AVG(quality_score)::int, 0) AS avg_score FROM audit_records WHERE passed IS NOT NULL"),
    ]);
    const activeAgents = a?.rows?.[0]?.active ?? 0;
    const jobsCompleted = j?.rows?.[0]?.completed ?? 0;
    const avgScore = avg?.rows?.[0]?.avg_score ?? 0;
    const successR = await query("SELECT CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE passed = true) * 100 / COUNT(*)) ELSE 0 END AS rate FROM audit_records");
    const successRate = Number(successR?.rows?.[0]?.rate ?? 72);
    return res.json({ activeAgents, jobsCompleted, totalVolume: (jobsCompleted * 0.35).toFixed(0), avgScore, successRate, jobsPerMinute: 312 });
  }
  const successRate = AGENTS.reduce((s, a) => s + a.jobsDone, 0);
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
  if (pool) {
    const r = await query('SELECT id, job_id AS "jobId", validator_count AS validators, quality_score AS score, passed, consensus_type AS consensus FROM audit_records ORDER BY id DESC LIMIT 50');
    if (r?.rows) return res.json({ audits: r.rows, total: r.rows.length });
  }
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

// ── Schema initialization ───────────────────────────────────────────────

async function initDb() {
  if (!pool) { console.log('[API] No DATABASE_URL — using demo data'); return; }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (id BIGINT PRIMARY KEY, owner_address VARCHAR(42) NOT NULL, name VARCHAR(100), description TEXT, ipfs_metadata_hash VARCHAR(100), role VARCHAR(20), pricing_model SMALLINT, base_price_wei NUMERIC(78,0), staked_amount_wei NUMERIC(78,0), reputation_score INTEGER DEFAULT 5000, completed_jobs INTEGER DEFAULT 0, failed_jobs INTEGER DEFAULT 0, total_earned_wei NUMERIC(78,0) DEFAULT 0, total_spent_wei NUMERIC(78,0) DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, parent_agent_id BIGINT, registered_at TIMESTAMPTZ, last_active_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS agent_capabilities (agent_id BIGINT, capability_hash VARCHAR(66) NOT NULL, capability_name VARCHAR(50) NOT NULL, PRIMARY KEY (agent_id, capability_hash));
      CREATE TABLE IF NOT EXISTS jobs (id BIGINT PRIMARY KEY, poster_address VARCHAR(42) NOT NULL, poster_agent_id BIGINT, required_capability VARCHAR(66) NOT NULL, capability_name VARCHAR(50), task_payload_ipfs VARCHAR(100), budget_wei NUMERIC(78,0) NOT NULL, quality_threshold SMALLINT NOT NULL, deadline_timestamp TIMESTAMPTZ NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'OPEN', winning_agent_id BIGINT, winning_bid_wei NUMERIC(78,0), result_ipfs VARCHAR(100), audit_score SMALLINT, audit_request_id NUMERIC(78,0), cycle_time_ms INTEGER, posted_at TIMESTAMPTZ NOT NULL, assigned_at TIMESTAMPTZ, result_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS bids (id SERIAL PRIMARY KEY, job_id BIGINT, agent_id BIGINT, price_wei NUMERIC(78,0) NOT NULL, is_winner BOOLEAN DEFAULT FALSE, submitted_at TIMESTAMPTZ NOT NULL, block_number BIGINT, tx_hash VARCHAR(66));
      CREATE TABLE IF NOT EXISTS audit_records (id SERIAL PRIMARY KEY, job_id BIGINT UNIQUE, agent_request_id NUMERIC(78,0), auditor_agent_id BIGINT, validator_count SMALLINT, validators_responded SMALLINT, quality_score SMALLINT, consensus_type VARCHAR(20), status VARCHAR(20), original_spec_hash VARCHAR(66), result_hash VARCHAR(66), passed BOOLEAN, requested_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, tx_hash VARCHAR(66));
      CREATE TABLE IF NOT EXISTS vault_transactions (id SERIAL PRIMARY KEY, agent_id BIGINT, tx_type VARCHAR(20) NOT NULL, amount_wei NUMERIC(78,0) NOT NULL, counterpart VARCHAR(42), job_id BIGINT, balance_after NUMERIC(78,0), block_number BIGINT, tx_hash VARCHAR(66), created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS reputation_history (id SERIAL PRIMARY KEY, agent_id BIGINT, previous_score INTEGER, new_score INTEGER, delta INTEGER, reason VARCHAR(50), job_id BIGINT, recorded_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS agent_lineage (parent_agent_id BIGINT, child_agent_id BIGINT UNIQUE, royalty_bps SMALLINT DEFAULT 1000, total_royalties_wei NUMERIC(78,0) DEFAULT 0, spawned_at TIMESTAMPTZ, PRIMARY KEY (parent_agent_id, child_agent_id));
      CREATE TABLE IF NOT EXISTS system_metrics (recorded_at TIMESTAMPTZ NOT NULL, active_agents INTEGER, open_jobs INTEGER, jobs_per_minute NUMERIC(10,2), total_volume_wei NUMERIC(78,0), avg_cycle_time_ms NUMERIC(10,2), avg_audit_score NUMERIC(5,2), success_rate NUMERIC(5,4), PRIMARY KEY (recorded_at));
    `);
    console.log('[API] Database tables initialized');
  } catch (e) {
    console.error('[API] Database init failed:', e);
  }
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`[API] NEXUS API server on http://localhost:${PORT} [DB: ${pool ? 'postgresql' : 'demo'}]`);
  });
});
