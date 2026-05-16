'use client';

import { useWallet } from "@/hooks/useWallet";

export function Nav() {
  const { address, balance, connect, disconnect } = useWallet();

  return (
    <nav className="border-b border-[#2D3148] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold" style={{ color: '#6C5CE7' }}>NEXUS</span>
        <span className="text-xs text-[#636E72] ml-2">Autonomous Agent Economy</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <a href="/" className="text-[#A0A3B1] hover:text-white transition-colors">Live Feed</a>
        <a href="/deploy" className="text-[#A0A3B1] hover:text-white transition-colors">Deploy</a>
        <a href="/dashboard" className="text-[#A0A3B1] hover:text-white transition-colors">Dashboard</a>
        <a href="/marketplace" className="text-[#A0A3B1] hover:text-white transition-colors">Jobs</a>
        <a href="/network" className="text-[#A0A3B1] hover:text-white transition-colors">Network</a>
        <a href="/audit-log" className="text-[#A0A3B1] hover:text-white transition-colors">Audit Log</a>
        {address ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#00B894] font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
            {balance && <span className="text-xs text-[#636E72]">{balance}</span>}
            <button onClick={disconnect} className="border border-[#2D3148] hover:border-[#D63031] px-3 py-1.5 rounded-md text-xs transition-colors">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connect} className="bg-[#6C5CE7] hover:bg-[#5A4BD1] px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
