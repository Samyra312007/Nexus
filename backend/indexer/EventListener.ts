import { createPublicClient, http, parseAbiItem } from 'viem';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';
const REGISTRY_ADDRESS = process.env.NEXUS_REGISTRY || '';
const JOB_ENGINE_ADDRESS = process.env.NEXUS_JOB_ENGINE || '';
const ESCROW_ADDRESS = process.env.NEXUS_ESCROW || '';
const AUDIT_ENGINE_ADDRESS = process.env.NEXUS_AUDIT_ENGINE || '';

const client = createPublicClient({
  chain: { id: Number(process.env.SOMNIA_CHAIN_ID || 50312), name: 'Somnia', nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
  transport: http(RPC_URL),
});

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false })
  : null;

async function query(text: string, params?: any[]) {
  if (!pool) { console.log('[Indexer] No DATABASE_URL, skipping insert'); return null; }
  try { return await pool.query(text, params); } catch (e: any) { console.error('[Indexer] DB error:', e.message); return null; }
}

const EVENTS = {
  AgentRegistered: parseAbiItem('event AgentRegistered(uint256 indexed agentId, address indexed owner, bytes32[] capabilities)'),
  JobPosted: parseAbiItem('event JobPosted(uint256 indexed jobId, bytes32 indexed capability, uint256 budget, uint256 deadline)'),
  BidSubmitted: parseAbiItem('event BidSubmitted(uint256 indexed jobId, uint256 indexed agentId, uint256 price)'),
  JobAssigned: parseAbiItem('event JobAssigned(uint256 indexed jobId, uint256 indexed agentId, uint256 price)'),
  ResultSubmitted: parseAbiItem('event ResultSubmitted(uint256 indexed jobId, uint256 indexed agentId, bytes result)'),
  JobCompleted: parseAbiItem('event JobCompleted(uint256 indexed jobId, uint256 qualityScore)'),
  JobFailed: parseAbiItem('event JobFailed(uint256 indexed jobId, string reason)'),
  EscrowReleased: parseAbiItem('event EscrowReleased(uint256 indexed jobId, address worker, uint256 amount)'),
  EscrowRefunded: parseAbiItem('event EscrowRefunded(uint256 indexed jobId, address poster, uint256 amount)'),
  AuditCompleted: parseAbiItem('event AuditCompleted(uint256 indexed jobId, uint256 qualityScore, bool passed)'),
  AgentSlashed: parseAbiItem('event AgentSlashed(uint256 indexed agentId, uint256 slashAmount, string reason)'),
  ReputationUpdated: parseAbiItem('event ReputationUpdated(uint256 indexed agentId, uint256 newScore, int256 delta)'),
  VaultEarned: parseAbiItem('event VaultEarned(uint256 indexed agentId, uint256 amount, uint256 newBalance)'),
} as const;

async function startIndexer() {
  console.log('[Indexer] Starting NEXUS event indexer...');
  if (!pool) console.log('[Indexer] No DATABASE_URL set — running in dry mode (events logged only)');

  const unwatch = client.watchContractEvent({
    address: REGISTRY_ADDRESS as `0x${string}`,
    event: EVENTS.AgentRegistered,
    onLogs: (logs) => {
      for (const log of logs) {
        const { agentId, owner, capabilities } = log.args;
        console.log(`[Indexer] AgentRegistered: #${agentId} by ${owner}`);
        query(
          `INSERT INTO agents (id, owner_address, is_active, registered_at)
           VALUES ($1, $2, true, NOW())
           ON CONFLICT (id) DO UPDATE SET owner_address = EXCLUDED.owner_address`,
          [Number(agentId), owner]
        );
        for (const cap of (capabilities ?? [])) {
          query(
            `INSERT INTO agent_capabilities (agent_id, capability_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [Number(agentId), cap]
          );
        }
      }
    },
  });

  // Also watch jobs from JobEngine
  client.watchContractEvent({
    address: JOB_ENGINE_ADDRESS as `0x${string}`,
    event: EVENTS.JobPosted,
    onLogs: (logs) => {
      for (const log of logs) {
        const { jobId, capability, budget, deadline } = log.args;
        console.log(`[Indexer] JobPosted: #${jobId} cap:${capability} budget:${budget}`);
        query(
          `INSERT INTO jobs (id, poster_address, required_capability, budget_wei, deadline_timestamp, status, posted_at)
           VALUES ($1, $2, $3, $4, to_timestamp($5), 'OPEN', NOW())
           ON CONFLICT (id) DO NOTHING`,
          [Number(jobId), log.address, capability, Number(budget), Number(deadline)]
        );
      }
    },
  });

  client.watchContractEvent({
    address: JOB_ENGINE_ADDRESS as `0x${string}`,
    event: EVENTS.JobCompleted,
    onLogs: (logs) => {
      for (const log of logs) {
        const { jobId, qualityScore } = log.args;
        console.log(`[Indexer] JobCompleted: #${jobId} score:${qualityScore}`);
        query(
          `UPDATE jobs SET status = 'COMPLETED', audit_score = $2, completed_at = NOW() WHERE id = $1`,
          [Number(jobId), Number(qualityScore)]
        );
      }
    },
  });

  client.watchContractEvent({
    address: AUDIT_ENGINE_ADDRESS as `0x${string}`,
    event: EVENTS.AuditCompleted,
    onLogs: (logs) => {
      for (const log of logs) {
        const { jobId, qualityScore, passed } = log.args;
        console.log(`[Indexer] AuditCompleted: Job#${jobId} score:${qualityScore} passed:${passed}`);
        query(
          `INSERT INTO audit_records (job_id, quality_score, passed, completed_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (job_id) DO UPDATE SET quality_score = EXCLUDED.quality_score, passed = EXCLUDED.passed, completed_at = NOW()`,
          [Number(jobId), Number(qualityScore), passed]
        );
      }
    },
  });

  client.watchContractEvent({
    address: ESCROW_ADDRESS as `0x${string}`,
    event: EVENTS.EscrowReleased,
    onLogs: (logs) => {
      for (const log of logs) {
        const { jobId, worker, amount } = log.args;
        console.log(`[Indexer] EscrowReleased: Job#${jobId} worker:${worker} amount:${amount}`);
      }
    },
  });

  process.on('SIGINT', () => {
    console.log('[Indexer] Stopping...');
    unwatch();
    process.exit(0);
  });
}

startIndexer().catch(console.error);
