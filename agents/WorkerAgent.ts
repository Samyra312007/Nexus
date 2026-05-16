import { SomniaAgentKit, SOMNIA_NETWORKS } from 'somnia-agent-kit';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { NexusAgentConfig, JobPostedEvent, JobAssignedEvent } from './types/agent.types.js';

dotenv.config();

const JOB_ENGINE_ADDRESS = process.env.NEXUS_JOB_ENGINE || '0x0000000000000000000000000000000000000000';
const REGISTRY_ADDRESS = process.env.NEXUS_REGISTRY || '0x0000000000000000000000000000000000000000';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';

const JOB_ENGINE_ABI = [
  {
    type: 'event',
    name: 'JobPosted',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: true, name: 'capability', type: 'bytes32' },
      { indexed: false, name: 'budget', type: 'uint256' },
      { indexed: false, name: 'deadline', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'JobAssigned',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'submitBid',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitResult',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'result', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getJob',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'poster', type: 'address' },
      { name: 'requiredCapability', type: 'bytes32' },
      { name: 'taskPayloadIPFS', type: 'string' },
      { name: 'budgetWei', type: 'uint256' },
      { name: 'qualityThreshold', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'winningAgentId', type: 'uint256' },
      { name: 'resultCalldata', type: 'bytes' },
      { name: 'auditScore', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'registerAgent',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'ipfsHash', type: 'string' },
      { name: 'capabilities', type: 'bytes32[]' },
      { name: 'pricingModel', type: 'uint8' },
      { name: 'basePrice', type: 'uint256' },
      { name: 'parentAgent', type: 'address' },
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'payable',
  },
] as const;

export class NexusWorkerAgent {
  private config: NexusAgentConfig;
  private agentId: bigint | null = null;
  private walletClient;
  private publicClient;
  private account;

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

  async initialize(): Promise<bigint> {
    const caps = this.config.capabilities.map(
      (c) => ('0x' + Buffer.from(c).toString('hex').padEnd(64, '0')) as `0x${string}`
    );

    const { request } = await this.publicClient.simulateContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: 'registerAgent',
      args: [this.config.name, this.config.description, 'QmPlaceholder', caps, 0, this.config.basePrice, '0x0000000000000000000000000000000000000000'],
      value: this.config.minStake,
      account: this.account,
    });

    const hash = await this.walletClient.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    this.agentId = 1n; // simplified — would parse from event logs

    console.log(`[WorkerAgent] Registered as agent #${this.agentId}`);
    return this.agentId;
  }

  async start(): Promise<void> {
    console.log(`[WorkerAgent] Starting with capabilities: ${this.config.capabilities.join(', ')}`);

    const unwatch = this.publicClient.watchContractEvent({
      address: JOB_ENGINE_ADDRESS as `0x${string}`,
      abi: JOB_ENGINE_ABI,
      eventName: 'JobPosted',
      onLogs: async (logs) => {
        for (const log of logs) {
          const { jobId, capability, budget, deadline } = log.args as unknown as JobPostedEvent;
          if (this.canHandleJob(capability)) {
            await this.handleJobPosted(jobId, budget);
          }
        }
      },
    });

    process.on('SIGINT', () => { unwatch(); process.exit(0); });
  }

  private canHandleJob(requiredCapability: `0x${string}`): boolean {
    const capHex = requiredCapability.toLowerCase();
    return this.config.capabilities.some(
      (c) => ('0x' + Buffer.from(c).toString('hex').padEnd(64, '0')).toLowerCase() === capHex
    );
  }

  private async handleJobPosted(jobId: bigint, budget: bigint): Promise<void> {
    const bidPrice = this.calculateBid(budget);
    console.log(`[WorkerAgent] Bidding on Job#${jobId} — price: ${bidPrice} SOM`);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: JOB_ENGINE_ADDRESS as `0x${string}`,
        abi: JOB_ENGINE_ABI,
        functionName: 'submitBid',
        args: [jobId, bidPrice],
        account: this.account,
      });
      const hash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`[WorkerAgent] Bid submitted for Job#${jobId}`);
    } catch (err) {
      console.error(`[WorkerAgent] Bid failed for Job#${jobId}:`, err);
    }
  }

  private calculateBid(budget: bigint): bigint {
    const margin = BigInt(Math.floor(Math.random() * 30 + 10)); // 10-40% discount
    return (budget * margin) / 100n;
  }

  async executeTask(jobId: bigint, taskSpec: string): Promise<`0x${string}`> {
    console.log(`[WorkerAgent] Executing Job#${jobId}: ${taskSpec.substring(0, 100)}...`);
    const result = `0x${Buffer.from(JSON.stringify({ result: 'task_completed', jobId: jobId.toString() })).toString('hex')}` as `0x${string}`;

    try {
      const { request } = await this.publicClient.simulateContract({
        address: JOB_ENGINE_ADDRESS as `0x${string}`,
        abi: JOB_ENGINE_ABI,
        functionName: 'submitResult',
        args: [jobId, result],
        account: this.account,
      });
      const hash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`[WorkerAgent] Result submitted for Job#${jobId}`);
    } catch (err) {
      console.error(`[WorkerAgent] Submit result failed for Job#${jobId}:`, err);
    }

    return result;
  }
}
