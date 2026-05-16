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
  'data-scraping': '0x79ce3061a0856ca55a98fa1cb45cf499f6180f04598a3b9f67e1d6db97aa6490',
  'sentiment-analysis': '0x4b8087b509e6cc2cb0134c9a0501afba82bdbcbd123871c2c939b30a4f30d82c',
  'price-oracle': '0xe84a466f61fd3ef7b48426e340721de4a6859b63f9d22100f241f38815209150',
  'image-generation': '0xb4420fe0b67b01fb28012cd3030277d5b1ac1edefa9db3c3628beebcf58d96bd',
  'contract-audit': '0x0d47e24f629a80848cbaa1dc79072c821ba518196dd944b04784a11e09db2763',
  'text-summarization': '0x5462285c928e768a6e9b573816def3af227434696aed3c25b1f020fa141adc38',
  'event-verification': '0x324cb3d02edbe1b4b2c2458aba54d9d222feb7163d72d75622a21ed5b9fb25f5',
  'defi-signal': '0x85f65dff72913177dd6d2c591cd5eb97f8e579de06aacefa5ad5d8ec5b65cab5',
  'audit-qa': '0x9c5a9d5ceeaa2aac50dd72fd88386b5b4c6076f1710577a0b238f4a80e6ef5b0',
};
