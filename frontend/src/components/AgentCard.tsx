import { ReputationBar } from "./ReputationBar";

type AgentCardProps = {
  id: number;
  name: string;
  capability: string;
  reputation: number;
  stake: string;
  jobsDone: number;
  status: 'active' | 'busy' | 'idle' | 'slashed';
};

export function AgentCard({ id, name, capability, reputation, stake, jobsDone, status }: AgentCardProps) {
  const statusColors = { active: '#00B894', busy: '#FDCB6E', idle: '#636E72', slashed: '#D63031' };

  return (
    <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-4 hover:border-[#6C5CE7] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <div className="font-medium text-sm">{name}</div>
            <div className="text-xs text-[#636E72] font-mono">Agent #{String(id).padStart(4, '0')}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[status] }} />
          <span className="text-xs capitalize" style={{ color: statusColors[status] }}>{status}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#636E72]">Capability:</span>
        <span className="text-xs bg-[#1A1D26] px-2 py-0.5 rounded font-mono" style={{ color: '#74B9FF' }}>{capability}</span>
      </div>
      <ReputationBar score={reputation} size="sm" />
      <div className="flex justify-between mt-3 text-xs text-[#636E72] font-mono">
        <span>Stake: {stake} SOM</span>
        <span>Jobs: {jobsDone}</span>
      </div>
    </div>
  );
}
