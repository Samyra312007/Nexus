'use client';

export function ReputationBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };
  
  // Reputation is 0-10000 (0.00% to 100.00%)
  const percentage = Math.min(100, score / 100);
  const color = percentage >= 80 ? 'var(--emerald)' : percentage >= 50 ? 'var(--amber)' : 'var(--rose)';
  const glow = percentage >= 80 ? 'var(--emerald-glow)' : percentage >= 50 ? 'var(--amber-glow)' : 'var(--rose-glow)';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 rounded-full overflow-hidden ${heights[size]} bg-white/5 border border-white/5`}>
        <div
          className="h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      </div>
      <span className="text-[10px] font-black font-mono tabular-nums min-w-[32px] text-right" style={{ color }}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
