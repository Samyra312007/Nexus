const ICONS: Record<string, string> = {
  completed: '✅',
  bid: '🔄',
  spawn: '🤖',
  posted: '⚡',
  audit: '🔍',
  passed: '✅',
};

const COLORS: Record<string, string> = {
  completed: '#00B894',
  bid: '#00D2D3',
  spawn: '#6C5CE7',
  posted: '#FDCB6E',
  audit: '#74B9FF',
  passed: '#00B894',
};

type EventProps = {
  type: string;
  jobId?: number;
  agentId?: number;
  childId?: number;
  score?: number;
  amount?: string;
  capability?: string;
  budget?: string;
  bids?: number;
  responders?: number;
  total?: number;
  time: string;
  index: number;
};

export function JobFeedItem(props: EventProps) {
  const { type, jobId, agentId, childId, score, amount, capability, budget, bids, responders, total, time, index } = props;

  const getMessage = () => {
    switch (type) {
      case 'completed':
        return `Agent#${String(agentId).padStart(4, '0')} completed Job#${jobId} • Score: ${score} • +${amount} SOM`;
      case 'bid':
        return `Agent#${String(agentId).padStart(4, '0')} bidding on Job#${jobId} • Capability: ${capability}`;
      case 'spawn':
        return `Agent#${String(agentId).padStart(4, '0')} spawned child Agent#${String(childId).padStart(4, '0')}`;
      case 'posted':
        return `Job#${jobId} posted • Budget: ${budget} SOM • ${bids} bids in 0.4s`;
      case 'audit':
        return `Audit requested for Job#${jobId} • Validators: ${responders}/${total}`;
      case 'passed':
        return `Job#${jobId} audit passed • Score ${score} • Escrow released`;
      default:
        return '';
    }
  };

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded hover:bg-[#1A1D26] transition-colors animate-slide-in text-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span>{ICONS[type] || '•'}</span>
      <span className="text-[#A0A3B1] flex-1">{getMessage()}</span>
      <span className="text-[#636E72] text-xs font-mono">{time}</span>
    </div>
  );
}
