'use client';

import { useWallet } from "@/hooks/useWallet";

export function Nav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { address, balance, connect, disconnect, isConnecting } = useWallet();

  return (
    <nav className="h-14 border-b border-[#2D3148] px-4 flex items-center justify-between bg-[#0A0B0F]">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-[#1E1F2B] transition-colors text-[#636E72] hover:text-white"
        title="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex items-center gap-4 text-sm">
        {address ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#00B894] font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
            {balance && <span className="text-xs text-[#636E72]">{balance}</span>}
            <button onClick={disconnect} className="border border-[#2D3148] hover:border-[#D63031] px-3 py-1.5 rounded-md text-xs transition-colors">
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="bg-[#6C5CE7] hover:bg-[#5A4BD1] disabled:opacity-50 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}
