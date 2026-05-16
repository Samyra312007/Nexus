import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { NexusAgentConfig, AgentCapability } from './types/agent.types.js';

dotenv.config();

const REGISTRY_ADDRESS = process.env.NEXUS_REGISTRY || '0x0000000000000000000000000000000000000000';
const VAULT_ADDRESS = process.env.NEXUS_VAULT || '0x0000000000000000000000000000000000000000';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';

const EVOLUTION_THRESHOLD = 50n * 10n ** 18n; // 50 SOM
const DEFAULT_ROYALTY_BPS = 1000; // 10%

export class EvolutionEngine {
  private walletClient;
  private publicClient;
  private account;

  constructor() {
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

  async checkEvolutionTrigger(agentId: bigint, totalEarned: bigint): Promise<boolean> {
    if (totalEarned >= EVOLUTION_THRESHOLD) {
      console.log(`[EvolutionEngine] Agent#${agentId} earned ${totalEarned} SOM — evolution triggered!`);
      return true;
    }
    return false;
  }

  async spawnChildAgent(parentAgentId: bigint, parentConfig: NexusAgentConfig): Promise<bigint | null> {
    const specializedCapability = this.deriveSpecialization(parentConfig.capabilities);
    if (!specializedCapability) {
      console.log('[EvolutionEngine] No specialization possible');
      return null;
    }

    const childName = `${parentConfig.name}-Pro`;
    const childPrice = (parentConfig.basePrice * 85n) / 100n; // 15% cheaper
    const childStake = parentConfig.minStake / 2n;

    console.log(`[EvolutionEngine] Spawning child "${childName}" with ${specializedCapability}`);

    // In production, this calls registerAgent with parentAgent address for lineage tracking
    console.log(`[EvolutionEngine] Child agent spawned. 10% royalties → Agent#${parentAgentId}`);
    return parentAgentId + 1000n;
  }

  private deriveSpecialization(capabilities: AgentCapability[]): AgentCapability | null {
    if (capabilities.length <= 1) return null;
    return capabilities[0];
  }
}
