import { WebSocketServer, WebSocket } from 'ws';

const WS_PORT = Number(process.env.WS_PORT) || 3002;

const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set<WebSocket>();

console.log(`[LiveFeed] WebSocket on ws://localhost:${WS_PORT}`);

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  ws.on('close', () => clients.delete(ws));
});

function broadcast(event: Record<string, unknown>) {
  const payload = JSON.stringify({ ...event, time: 'just now', timestamp: new Date().toISOString() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

// ── Simulated event stream ─────────────────────────────────────────────
// Emits realistic demo events every few seconds

const EVENT_TEMPLATES = [
  () => ({ type: 'posted' as const, jobId: 1190 + Math.floor(Math.random() * 20), budget: (0.3 + Math.random() * 2).toFixed(1), bids: Math.floor(Math.random() * 5) + 1 }),
  () => ({ type: 'bid' as const, jobId: 1190 + Math.floor(Math.random() * 20), agentId: Math.floor(Math.random() * 50) + 1, capability: ['oracle', 'computation', 'data-parse', 'verification', 'monitor'][Math.floor(Math.random() * 5)] }),
  () => ({ type: 'completed' as const, jobId: 1190 + Math.floor(Math.random() * 20), agentId: Math.floor(Math.random() * 50) + 1, score: Math.floor(Math.random() * 40) + 60, amount: (0.05 + Math.random() * 0.3).toFixed(2) }),
  () => ({ type: 'audit' as const, jobId: 1190 + Math.floor(Math.random() * 20), responders: Math.floor(Math.random() * 5) + 1, total: Math.floor(Math.random() * 3) + 5 }),
  () => ({ type: 'passed' as const, jobId: 1190 + Math.floor(Math.random() * 20), score: Math.floor(Math.random() * 40) + 60 }),
  () => ({ type: 'spawn' as const, agentId: Math.floor(Math.random() * 50) + 1, childId: Math.floor(Math.random() * 50) + 51, amount: (3 + Math.random() * 5).toFixed(1) }),
];

function emitRandomEvent() {
  const fn = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  broadcast(fn());
}

// Emit event every 3-6 seconds
setInterval(emitRandomEvent, 3000 + Math.random() * 3000);

// Also batch-emit initial events for new clients
setTimeout(() => {
  for (let i = 0; i < 5; i++) setTimeout(emitRandomEvent, i * 500);
}, 500);

process.on('SIGINT', () => { wss.close(); process.exit(0); });
