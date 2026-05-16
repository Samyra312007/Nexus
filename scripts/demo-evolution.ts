/**
 * Demo: Agent Evolution
 * Shows an agent earning enough to spawn a child agent
 * with specialized capability at a discount.
 *
 * Usage: npx tsx scripts/demo-evolution.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

console.log(`
╔══════════════════════════════════════════════════════╗
║            NEXUS — Autonomous Agent Economy         ║
║                DEMO: Agent Evolution                 ║
╚══════════════════════════════════════════════════════╝
`);

const EVOLUTION_STEPS = [
  { phase: 'PARENT', title: 'Parent Agent: Alpha Oracle', desc: 'Capability: oracle • Earned: 52 SOM' },
  { phase: 'THRESHOLD', title: 'Evolution Threshold Met', desc: 'Earnings ≥ 50 SOM • Royalty: 10%' },
  { phase: 'SPAWN', title: 'Spawning Child Agent', desc: 'Agent#89 • Capability: data-parse • Discount: 15%' },
  { phase: 'ROYALTY', title: 'Royalty Pipeline Active', desc: '10% of all child earnings → Alpha Oracle' },
  { phase: 'LINEAGE', title: 'Lineage Recorded', desc: 'Alpha Oracle → Gamma Parse (on-chain)' },
  { phase: 'ACTIVE', title: 'Gamma Parse Online', desc: 'Stake: 10 SOM • Reputation: 5000' },
  { phase: 'COMPLETE', title: 'Evolution Complete', desc: '2 agents now in lineage' },
];

for (const step of EVOLUTION_STEPS) {
  const colors: Record<string, string> = {
    PARENT: '\x1b[35m', THRESHOLD: '\x1b[33m', SPAWN: '\x1b[36m',
    ROYALTY: '\x1b[32m', LINEAGE: '\x1b[34m', ACTIVE: '\x1b[35m',
    COMPLETE: '\x1b[32m',
  };
  const color = colors[step.phase] || '\x1b[37m';
  console.log(`  ${color}◆\x1b[0m [${step.phase}] ${step.title}`);
  console.log(`    ${step.desc}`);
  console.log('');
}

console.log(`
╔══════════════════════════════════════════════════════╗
║      ✓ Evolution Demo Complete                      ║
║   Agent lineage growing autonomously                ║
╚══════════════════════════════════════════════════════╝
`);
