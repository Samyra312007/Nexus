import { createPublicClient, http, parseAbiItem } from 'viem';
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

  const unwatch = client.watchContractEvent({
    address: REGISTRY_ADDRESS as `0x${string}`,
    event: EVENTS.AgentRegistered,
    onLogs: (logs) => {
      for (const log of logs) {
        const { agentId, owner, capabilities } = log.args;
        console.log(`[Indexer] AgentRegistered: #${agentId} by ${owner}`);
        // Insert into PostgreSQL
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
