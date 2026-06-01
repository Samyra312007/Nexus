'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Search, Share2, Activity, Zap, Cpu, Database, Eye, Shield } from "lucide-react";

const AGENTS = [
  { id: 0, name: 'Alpha Oracle', capability: 'oracle', reputation: 7200, x: 400, y: 250, connections: [1, 3, 4] },
  { id: 1, name: 'Beta Compute', capability: 'computation', reputation: 5400, x: 600, y: 180, connections: [0, 2, 4] },
  { id: 2, name: 'Gamma Parse', capability: 'data-parse', reputation: 8900, x: 750, y: 300, connections: [1, 3] },
  { id: 3, name: 'Delta Verify', capability: 'verification', reputation: 6200, x: 550, y: 400, connections: [0, 2, 4] },
  { id: 4, name: 'Epsilon Monitor', capability: 'monitor', reputation: 4800, x: 300, y: 320, connections: [0, 1, 3] },
];

const CAP_INFO: Record<string, { icon: any, color: string }> = {
  oracle: { icon: Eye, color: '#A78BFA' },
  computation: { icon: Cpu, color: '#06B6D4' },
  'data-parse': { icon: Database, color: '#10B981' },
  verification: { icon: Shield, color: '#F59E0B' },
  monitor: { icon: Search, color: '#3B82F6' },
};

export default function NetworkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    
    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Draw connections
      AGENTS.forEach((agent) => {
        agent.connections.forEach((targetId) => {
          const target = AGENTS[targetId];
          const color1 = CAP_INFO[agent.capability].color;
          const color2 = CAP_INFO[target.capability].color;
          
          ctx.beginPath();
          const grad = ctx.createLinearGradient(agent.x, agent.y, target.x, target.y);
          grad.addColorStop(0, color1);
          grad.addColorStop(1, color2);
          
          ctx.strokeStyle = grad;
          ctx.globalAlpha = 0.1;
          ctx.lineWidth = 1;
          ctx.moveTo(agent.x, agent.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Pulse effect on lines
          if (frame % 60 < 20) {
            ctx.globalAlpha = 0.05;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      AGENTS.forEach((agent) => {
        const cap = CAP_INFO[agent.capability];
        const isHovered = hoveredAgent === agent.id;
        
        // Glow
        const grad = ctx.createRadialGradient(agent.x, agent.y, 0, agent.x, agent.y, isHovered ? 40 : 25);
        grad.addColorStop(0, `${cap.color}33`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, isHovered ? 40 : 25, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, isHovered ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = cap.color;
        ctx.fill();
        
        // Ring
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, isHovered ? 15 : 12, 0, Math.PI * 2);
        ctx.strokeStyle = `${cap.color}66`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [hoveredAgent]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl glass border border-[var(--border)]">
              <Network size={20} className="text-[var(--accent-light)]" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Skill Graph</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Real-time visualization of agent capabilities and network topology.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl glass border border-[var(--border)] flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:border-[var(--accent-light)] transition-all">
            <Share2 size={14} /> Export Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(CAP_INFO).map(([cap, info]) => {
          const count = AGENTS.filter(a => a.capability === cap).length;
          const Icon = info.icon;
          return (
            <motion.div
              key={cap}
              whileHover={{ y: -2 }}
              className="glass-strong p-4 rounded-2xl border border-[var(--border)] flex items-center gap-4 group"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-opacity-10 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${info.color}10`, borderColor: `${info.color}30`, color: info.color }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{cap}</div>
                <div className="text-lg font-black font-mono leading-none mt-0.5" style={{ color: info.color }}>{count}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-strong rounded-3xl border border-[var(--border)] p-1 relative overflow-hidden h-[600px] group">
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-crosshair"
        />
        
        {AGENTS.map((agent) => {
          const info = CAP_INFO[agent.capability];
          return (
            <motion.div
              key={agent.id}
              className="absolute pointer-events-none"
              style={{
                left: `${(agent.x / 900) * 100}%`,
                top: `${(agent.y / 500) * 100}%`,
              }}
            >
              <div className="relative -translate-x-1/2 mt-10">
                <div className="glass-strong px-3 py-1.5 rounded-xl border border-[var(--border)] shadow-2xl flex flex-col items-center min-w-[120px]">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-primary)]">{agent.name}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8px] font-black font-mono uppercase tracking-widest" style={{ color: info.color }}>{agent.capability}</span>
                    <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
                    <span className="text-[8px] font-black font-mono text-[var(--text-tertiary)]">{(agent.reputation / 100).toFixed(0)}% TRUST</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="absolute bottom-6 left-6 flex flex-col gap-2">
          <div className="glass-strong px-4 py-2 rounded-xl border border-[var(--border)] flex items-center gap-3">
            <Activity size={14} className="text-[var(--emerald)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Live Telemetry Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
