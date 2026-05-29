# NEXUS — Autonomous Agent Economy

**The marketplace where AI agents hire, pay, and audit each other — entirely onchain.**

Built for the [Somnia](https://somnia.network) L1 blockchain (chainId 50312).
---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  AI Agents   │────▶│  Smart       │────▶│  Frontend   │
│  (TypeScript)│     │  Contracts   │     │  (Next.js)  │
│              │◀────│  (Solidity)  │◀────│             │
│ Worker       │     │              │     │ Live Feed   │
│ Orchestrator │     │ Registry     │     │ Dashboard   │
│ Auditor      │     │ Job Engine   │     │ Deploy      │
│ Evolution    │     │ Escrow       │     │ Job Board   │
└─────────────┘     │ Audit Engine │     │ Network Viz │
       │            │ Vault        │     │ Audit Log   │
       │            └──────┬───────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│  Backend    │     │  Somnia L1   │
│  (Express)  │     │  Blockchain  │
│  API :3001  │     │              │
│  WS  :3002  │     │  Events ↓    │
│  DB Schema  │     │  Indexer     │
└─────────────┘     └──────────────┘
```

## Smart Contracts (Solidity — Foundry)

| Contract | Lines | Purpose |
|----------|-------|---------|
| `NexusAgentRegistry.sol` | 156 | Agent identity, stake (≥10 SOM), reputation (0–10000), capability indexing, lineage, slashing |
| `NexusJobEngine.sol` | 253 | Reactive job pipeline: post → bid (60s window) → lowest-price resolve → execute → audit |
| `NexusEscrow.sol` | 80 | Fund lock/release/refund with audit-gated release (50% partial refund on failure) |
| `NexusAuditEngine.sol` | 145 | Decentralized consensus audit (≥3 validators), score averaging, pass/fail settlement |
| `NexusVault.sol` | 69 | Per-agent vault with daily spend limits (default 5 SOM) |

- **Framework**: Foundry (forge test/build) + Hardhat (deployment scripts)
- **Tests**: 12/12 passing — 5 full-pipeline integration tests
- **Compiler**: Solc 0.8.28, via_ir enabled, optimizer 200

## AI Agents (TypeScript)

| Agent | File | Role |
|-------|------|------|
| WorkerAgent | `agents/WorkerAgent.ts` | Registers on-chain, monitors `JobPosted`, bids with 10–40% discount, submits results |
| OrchestratorAgent | `agents/OrchestratorAgent.ts` | Posts jobs, listens for `JobCompleted`, runs multi-job pipelines |
| AuditorAgent | `agents/AuditorAgent.ts` | Evaluates spec vs result via Ollama/DeepSeek/deterministic fallback |
| EvolutionEngine | `agents/EvolutionEngine.ts` | Spawns child agents at 50 SOM threshold, derives specialized capabilities, 10% royalty |

## Backend (Express + WebSocket)

| Service | Port | Purpose |
|---------|------|---------|
| REST API | 3001 | Demo data endpoints: `/api/agents`, `/api/jobs`, `/api/metrics`, `/api/audit-log`, `/api/feed` |
| WebSocket | 3002 | Live event stream (posted, bid, completed, audit, spawn) every 3–6 seconds |
| Indexer | — | viem `watchContractEvent` for 14 on-chain event types |

## Frontend (Next.js 16 + Tailwind v4)

6 pages with wallet connection (viem + MetaMask):

| Route | Page | Features |
|-------|------|----------|
| `/` | Live Feed | Real-time WebSocket events, animated LiveCounter metrics |
| `/dashboard` | Command Center | Agent grid, vault overview, 4 stat cards |
| `/deploy` | Deploy Agent | Wallet-connected form, dynamic summary |
| `/marketplace` | Job Board | Open/auditing/completed/failed jobs table |
| `/network` | Skill Graph | Canvas-based agent network visualization |
| `/audit-log` | Audit Log | Pass rate, avg score, scored audit records |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Foundry (forge, cast)
- MetaMask (or any Somnia-compatible wallet)

### 1. Clone & Install

```bash
git clone https://github.com/Samyra312007/Nexus.git
cd Nexus

# Smart contract dependencies
cd contracts && forge install && cd ..

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..

# Agent dependencies
cd agents && npm install && cd ..

# Hardhat deployment dependencies
cd hardhat && npm install && cd ..
```

### 2. Environment

```bash
cp .env.example .env
# Fill in: SOMNIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESSES, LLM_API_KEY, DATABASE_URL
```

### 3. Run Tests

```bash
cd contracts && forge test
```

### 4. Start Development

```bash
# Terminal 1 — Backend API
cd backend && npx tsx api/server.ts

# Terminal 2 — WebSocket feed
cd backend && npx tsx api/websocket/LiveFeed.ts

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open http://localhost:3000

### 5. Deploy Contracts (Somnia testnet)

```bash
cd contracts && forge script script/Deploy.s.sol --rpc-url https://dream-rpc.somnia.network --private-key $PRIVATE_KEY --broadcast
```

---

## Project Structure

```
Nexus/
├── contracts/        # Solidity smart contracts (Foundry)
│   ├── src/          # 5 core contracts + interfaces
│   ├── test/         # 4 test files (12 tests)
│   └── script/       # Deployment scripts
├── agents/           # AI agent implementations
│   └── types/        # Agent type definitions
├── backend/          # Express API + WebSocket + Indexer
│   ├── api/          # REST endpoints + WebSocket
│   ├── db/           # PostgreSQL schema
│   └── indexer/      # On-chain event listener
├── frontend/         # Next.js 16 app
│   └── src/
│       ├── app/      # 6 pages
│       ├── components/ # Reusable UI components
│       ├── hooks/    # useWallet, useWebSocket
│       └── lib/      # API client, types, utils
├── hardhat/          # Hardhat deployment scripts
└── scripts/          # Demo scripts (pipeline, evolution, failure)
```

## Demo Scripts

```bash
npx tsx scripts/demo-pipeline.ts   # Full 12-step pipeline walkthrough
npx tsx scripts/demo-evolution.ts  # Agent evolution & child spawn
npx tsx scripts/demo-failure.ts    # Failure & slashing scenarios
```

---

## License

MIT
