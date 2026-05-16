import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { NexusAgentConfig } from './types/agent.types.js';

dotenv.config();

const JOB_ENGINE_ADDRESS = process.env.NEXUS_JOB_ENGINE || '0x0000000000000000000000000000000000000000';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';

const JOB_ENGINE_ABI = [
  {
    type: 'event',
    name: 'JobCompleted',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'qualityScore', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'postJob',
    inputs: [
      { name: 'capability', type: 'bytes32' },
      { name: 'taskPayloadIPFS', type: 'string' },
      { name: 'qualityThreshold', type: 'uint256' },
      { name: 'deadlineOffset', type: 'uint256' },
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }],
    stateMutability: 'payable',
  },
] as const;

export class NexusOrchestratorAgent {
  private config: NexusAgentConfig;
  private walletClient;
  private publicClient;
  private account;
  private results: Map<bigint, { score: bigint; result: string }> = new Map();

  constructor(config: NexusAgentConfig) {
    this.config = config;
    this.account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: { id: Number(process.env.SOMNIA_CHAIN_ID || 50312), name: 'Somnia', nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
      transport: http(RPC_URL),
    });
    this.publicClient = createPublicClient({
      chain: { id: Number(process.env.SOMNIA_CHAIN_ID || 50312), name: 'Somnia', nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
      transport: http(RPC_URL),
    });
  }

  async start(): Promise<void> {
    console.log('[OrchestratorAgent] Starting — listening for JobCompleted events');

    const unwatch = this.publicClient.watchContractEvent({
      address: JOB_ENGINE_ADDRESS as `0x${string}`,
      abi: JOB_ENGINE_ABI,
      eventName: 'JobCompleted',
      onLogs: (logs) => {
        for (const log of logs) {
          const { jobId, qualityScore } = log.args as { jobId: bigint; qualityScore: bigint };
          console.log(`[OrchestratorAgent] Job#${jobId} completed with score: ${qualityScore}`);
          this.results.set(jobId, { score: qualityScore, result: 'completed' });
        }
      },
    });

    process.on('SIGINT', () => { unwatch(); process.exit(0); });
  }

  async postJob(capability: `0x${string}`, taskSpec: string, threshold: number = 75, budget: bigint = 0.5n * 10n ** 18n): Promise<bigint> {
    console.log(`[OrchestratorAgent] Posting job — capability: ${capability}, budget: ${budget}`);

    const { request } = await this.publicClient.simulateContract({
      address: JOB_ENGINE_ADDRESS as `0x${string}`,
      abi: JOB_ENGINE_ABI,
      functionName: 'postJob',
      args: [capability, taskSpec, BigInt(threshold), BigInt(300)],
      value: budget,
      account: this.account,
    });

    const hash = await this.walletClient.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    const jobId = 1n; // simplified — parse from logs
    console.log(`[OrchestratorAgent] Job#${jobId} posted`);
    return jobId;
  }

  async runPipeline(count: number, capability: `0x${string}`, taskSpec: string): Promise<void> {
    console.log(`[OrchestratorAgent] Running pipeline: ${count} jobs`);

    for (let i = 0; i < count; i++) {
      await this.postJob(capability, taskSpec);
      await new Promise((r) => setTimeout(r, 2000));
    }

    await new Promise((r) => setTimeout(r, 10000));
    console.log(`[OrchestratorAgent] Pipeline complete. ${this.results.size}/${count} jobs completed`);
  }
}
