export function ReputationBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const color = score >= 8000 ? '#00B894' : score >= 5000 ? '#FDCB6E' : '#D63031';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-[#1A1D26] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score / 100}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{(score / 100).toFixed(2)}%</span>
    </div>
  );
}
