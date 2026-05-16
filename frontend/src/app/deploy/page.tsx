'use client';

import { useState } from 'react';
import { useWallet } from "@/hooks/useWallet";

export default function DeployPage() {
  const { address, connect } = useWallet();
  const [name, setName] = useState('');
  const [capability, setCapability] = useState('oracle');
  const [stake, setStake] = useState(10);
  const [spendLimit, setSpendLimit] = useState(5);
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async () => {
    if (!address) { connect(); return; }
    if (!name || stake < 10) { alert('Name required, min stake 10 SOM'); return; }
    setDeploying(true);
    // Simulate deployment — real flow would call contract via viem
    await new Promise((r) => setTimeout(r, 1500));
    setDeploying(false);
    alert(`Agent "${name}" deployed! (simulated)`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">DEPLOY AGENT</h1>
        <p className="text-[#A0A3B1] text-sm">Configure and launch a new autonomous agent into the economy.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-6">
          <h2 className="font-semibold mb-4">Agent Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#A0A3B1] mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A1D26] border border-[#2D3148] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C5CE7]"
                placeholder="e.g. Data Oracle v1"
              />
            </div>

            <div>
              <label className="block text-sm text-[#A0A3B1] mb-1">Capability</label>
              <select value={capability} onChange={(e) => setCapability(e.target.value)}
                className="w-full bg-[#1A1D26] border border-[#2D3148] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C5CE7]">
                <option value="oracle">oracle</option>
                <option value="computation">computation</option>
                <option value="data-parse">data-parse</option>
                <option value="verification">verification</option>
                <option value="monitor">monitor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#A0A3B1] mb-1">Stake Amount (min 10 SOM)</label>
              <input value={stake} onChange={(e) => setStake(Number(e.target.value))}
                className="w-full bg-[#1A1D26] border border-[#2D3148] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C5CE7]"
                type="number" min={10} step={0.1}
              />
            </div>

            <div>
              <label className="block text-sm text-[#A0A3B1] mb-1">Daily Spend Limit (max 5 SOM)</label>
              <input value={spendLimit} onChange={(e) => setSpendLimit(Number(e.target.value))}
                className="w-full bg-[#1A1D26] border border-[#2D3148] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C5CE7]"
                type="number" min={0.1} max={5} step={0.1}
              />
            </div>

            <button onClick={handleDeploy} disabled={deploying}
              className="w-full bg-[#6C5CE7] hover:bg-[#5A4BD1] py-2.5 rounded-md font-medium transition-colors mt-4 disabled:opacity-50">
              {deploying ? 'Deploying...' : address ? 'Deploy Agent' : 'Connect Wallet & Deploy'}
            </button>
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#2D3148] rounded-lg p-6">
          <h2 className="font-semibold mb-4">Deployment Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[#2D3148]">
              <span className="text-[#A0A3B1]">Registration Fee</span>
              <span className="font-mono">~0.002 SOM</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2D3148]">
              <span className="text-[#A0A3B1]">Stake Lockup</span>
              <span className="font-mono">{stake.toFixed(1)} SOM</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2D3148]">
              <span className="text-[#A0A3B1]">Initial Reputation</span>
              <span className="font-mono" style={{ color: '#FDCB6E' }}>5000 / 10000</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#A0A3B1]">Default Spread</span>
              <span className="font-mono" style={{ color: '#00D2D3' }}>10–40% discount</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#1A1D26] rounded-md">
            <div className="text-xs text-[#636E72] mb-1 font-mono">Contract</div>
            <div className="text-xs font-mono text-[#74B9FF] break-all">
              NexusAgentRegistry · 0x0000...0000
            </div>
            {address && (
              <div className="mt-2 text-xs text-[#00B894] font-mono">
                Wallet: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
