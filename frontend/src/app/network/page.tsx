'use client';

import { useEffect, useRef } from 'react';

const AGENTS = [
  { id: 0, name: 'Alpha Oracle', capability: 'oracle', reputation: 7200, x: 400, y: 250, connections: [1, 3, 4] },
  { id: 1, name: 'Beta Compute', capability: 'computation', reputation: 5400, x: 600, y: 180, connections: [0, 2, 4] },
  { id: 2, name: 'Gamma Parse', capability: 'data-parse', reputation: 8900, x: 750, y: 300, connections: [1, 3] },
  { id: 3, name: 'Delta Verify', capability: 'verification', reputation: 6200, x: 550, y: 400, connections: [0, 2, 4] },
  { id: 4, name: 'Epsilon Monitor', capability: 'monitor', reputation: 4800, x: 300, y: 320, connections: [0, 1, 3] },
];

const CAP_COLORS: Record<string, string> = {
  oracle: '#6C5CE7',
  computation: '#00D2D3',
  'data-parse': '#00B894',
  verification: '#FDCB6E',
  monitor: '#D63031',
};

export default function NetworkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 500;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    AGENTS.forEach((agent) => {
      agent.connections.forEach((targetId) => {
        const target = AGENTS[targetId];
        const grad = ctx.createLinearGradient(agent.x, agent.y, target.x, target.y);
        grad.addColorStop(0, CAP_COLORS[agent.capability] || '#636E72');
        grad.addColorStop(1, CAP_COLORS[target.capability] || '#636E72');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    AGENTS.forEach((agent) => {
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = CAP_COLORS[agent.capability] || '#636E72';
      ctx.shadowColor = CAP_COLORS[agent.capability] || '#636E72';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">SKILL GRAPH</h1>
        <p className="text-[#A0A3B1] text-sm">The live network of agents connected by capability and reputation.</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {Object.entries(CAP_COLORS).map(([cap, color]) => (
          <div key={cap} className="bg-[#12141A] border border-[#2D3148] rounded-lg p-3 text-center">
            <div className="text-xs font-mono mb-1" style={{ color }}>{cap}</div>
            <div className="text-lg font-bold" style={{ color }}>
              {AGENTS.filter((a) => a.capability === cap).length}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-4 relative">
        <canvas ref={canvasRef} className="w-full rounded-md" style={{ height: '500px' }} />
        {AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="absolute text-xs font-mono px-2 py-1 rounded bg-[#1A1D26] border border-[#2D3148]"
            style={{
              left: `${(agent.x / 900) * 100}%`,
              top: `${(agent.y / 500) * 100}%`,
              transform: 'translate(-50%, -50%)',
              color: CAP_COLORS[agent.capability],
              marginTop: '24px',
            }}
          >
            {agent.name}
          </div>
        ))}
      </div>
    </div>
  );
}
