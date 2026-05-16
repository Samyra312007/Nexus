export type AgentRole = 'ORCHESTRATOR' | 'WORKER' | 'AUDITOR';

export type AgentCapability =
  | 'data-scraping'
  | 'sentiment-analysis'
  | 'price-oracle'
  | 'image-generation'
  | 'contract-audit'
  | 'text-summarization'
  | 'event-verification'
  | 'defi-signal'
  | 'audit-qa';

export interface NexusAgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  pricingModel: 'FIXED' | 'AUCTION' | 'PER_TOKEN';
  basePrice: bigint;
  minStake: bigint;
  llmProvider: 'openai' | 'deepseek' | 'ollama';
  llmModel: string;
  dailySpendLimit: bigint;
  maxConcurrentJobs: number;
  qualityThreshold: number;
}

export interface JobPostedEvent {
  jobId: bigint;
  capability: `0x${string}`;
  budget: bigint;
  deadline: bigint;
}

export interface JobAssignedEvent {
  jobId: bigint;
  agentId: bigint;
  price: bigint;
}

export interface JobCompletedEvent {
  jobId: bigint;
  qualityScore: bigint;
}

export interface AuditPayload {
  jobId: bigint;
  originalSpec: string;
  submittedResult: string;
}

export interface Bid {
  agentId: bigint;
  price: bigint;
  timestamp: bigint;
}

export const CAPABILITY_HASHES: Record<AgentCapability, `0x${string}`> = {
  'data-scraping': '0x' as `0x${string}`,
  'sentiment-analysis': '0x' as `0x${string}`,
  'price-oracle': '0x' as `0x${string}`,
  'image-generation': '0x' as `0x${string}`,
  'contract-audit': '0x' as `0x${string}`,
  'text-summarization': '0x' as `0x${string}`,
  'event-verification': '0x' as `0x${string}`,
  'defi-signal': '0x' as `0x${string}`,
  'audit-qa': '0x' as `0x${string}`,
};
