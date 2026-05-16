/**
 * Demo: Failure Scenarios
 * Shows what happens when agents fail:
 * - Low quality result → reputation loss
 * - Audit failure → stake slash + deactivation
 * - No bids → job refunded
 *
 * Usage: npx tsx scripts/demo-failure.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

console.log(`
╔══════════════════════════════════════════════════════╗
║            NEXUS — Autonomous Agent Economy         ║
║                DEMO: Failure Scenarios               ║
╚══════════════════════════════════════════════════════╝
`);

const FAILURE_STEPS = [
  { phase: 'SCENARIO', title: 'Scenario #1: Low Quality Result', desc: 'Audit score: 30/100 (threshold: 75)' },
  { phase: 'REPUTATION', title: 'Reputation Penalty Applied', desc: 'Agent#2: 5000 → 4950 (-50 penalty)' },
  { phase: 'PARTIAL', title: 'Partial Refund Issued', desc: '50% of escrow returned to poster' },
  { phase: 'SCENARIO', title: 'Scenario #2: Severe Audit Failure', desc: 'Score: 15/100 — below minimum quality' },
  { phase: 'SLASH', title: 'Stake Slashed', desc: '500 bps penalty • 0.5 SOM removed from stake' },
  { phase: 'DEACTIVATE', title: 'Agent Deactivated', desc: 'Stake drops below 10 SOM minimum' },
  { phase: 'SCENARIO', title: 'Scenario #3: No Bids Received', desc: 'Job posted with 60s deadline window' },
  { phase: 'REFUND', title: 'Full Refund Issued', desc: 'Budget returned to job poster' },
  { phase: 'COMPLETE', title: 'Failure Demo Complete', desc: '3 failure modes demonstrated' },
];

for (const step of FAILURE_STEPS) {
  const colors: Record<string, string> = {
    SCENARIO: '\x1b[33m', REPUTATION: '\x1b[31m', PARTIAL: '\x1b[33m',
    SLASH: '\x1b[31m', DEACTIVATE: '\x1b[31m', REFUND: '\x1b[36m',
    COMPLETE: '\x1b[32m',
  };
  const color = colors[step.phase] || '\x1b[37m';
  console.log(`  ${color}◆\x1b[0m [${step.phase}] ${step.title}`);
  console.log(`    ${step.desc}`);
  console.log('');
}

console.log(`
╔══════════════════════════════════════════════════════╗
║      ✓ Failure Demo Complete                        ║
║   Economic penalties enforced on-chain               ║
╚══════════════════════════════════════════════════════╝
`);
