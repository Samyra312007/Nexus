'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from "@/hooks/useWallet";
import { createWalletClient, custom } from 'viem';
import { NEXUS_REGISTRY, registryABI, NEXUS_CHAIN_ID } from "@/lib/contracts";
import { 
  Cpu, 
  Settings, 
  ShieldCheck, 
  Rocket, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft,
  Eye,
  Database,
  Search,
  Shield,
  Zap,
  Info
} from 'lucide-react';

const CAPABILITIES = ['oracle', 'computation', 'data-parse', 'verification', 'monitor'];

const CAP_INFO: Record<string, { icon: any, color: string, description: string }> = {
  oracle: { icon: Eye, color: '#A78BFA', description: 'Fetch and verify external data sources.' },
  computation: { icon: Cpu, color: '#06B6D4', description: 'Perform heavy offchain calculations.' },
  'data-parse': { icon: Database, color: '#10B981', description: 'Structure and index unstructured data.' },
  verification: { icon: Shield, color: '#F59E0B', description: 'Audit other agents and validate results.' },
  monitor: { icon: Search, color: '#3B82F6', description: 'Watch onchain events and trigger actions.' },
};

const SOMNIA_CHAIN = {
  id: NEXUS_CHAIN_ID,
  name: 'Somnia',
  nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
} as const;

export default function DeployPage() {
  const { address, connect, balance } = useWallet();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [capability, setCapability] = useState('oracle');
  const [stake, setStake] = useState(10);
  const [spendLimit, setSpendLimit] = useState(5);
  const [deploying, setDeploying] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleDeploy = async () => {
    if (!address) { connect(); return; }
    if (!name || stake < 10) return;
    setStep(2);

    try {
      const walletClient = createWalletClient({
        chain: SOMNIA_CHAIN,
        transport: custom(window.ethereum!),
      });

      const strToBytes32 = (s: string) => ('0x' + Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0')) as `0x${string}`;
      const capabilities = [strToBytes32(capability)];

      const hash = await walletClient.writeContract({
        address: NEXUS_REGISTRY,
        abi: registryABI,
        functionName: 'registerAgent',
        args: [name, '', '', capabilities, 0, BigInt(spendLimit) * BigInt(1e18), '0x0000000000000000000000000000000000000000'],
        value: BigInt(stake) * BigInt(1e18),
        account: address as `0x${string}`,
        chain: SOMNIA_CHAIN,
      });

      setTxHash(hash);
    } catch (e) {
      console.error('Deploy failed:', e);
      setStep(0);
      return;
    }

    const agent = {
      id: Math.floor(Math.random() * 9999),
      owner: address,
      name,
      capability,
      reputation: Math.floor(Math.random() * 2000) + 500,
      stake: stake.toFixed(1),
      jobsDone: 0,
      status: 'active' as const,
    };
    const existing = JSON.parse(localStorage.getItem('nexus_agents') || '[]');
    localStorage.setItem('nexus_agents', JSON.stringify([agent, ...existing]));
    setStep(3);
  };

  const steps = [
    { label: 'Configure', icon: Settings },
    { label: 'Review', icon: ShieldCheck },
    { label: 'Deploying', icon: Rocket },
    { label: 'Activated', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tighter uppercase mb-3"
        >
          Initialize <span className="gradient-text">Agent Node</span>
        </motion.h1>
        <p className="text-sm text-[var(--text-secondary)] font-medium">Provision a new autonomous entity on the Nexus Protocol.</p>
      </div>

      <div className="flex items-center justify-between mb-12 px-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = i <= step;
          const current = i === step;
          
          return (
            <div key={s.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    active 
                      ? 'bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] shadow-lg shadow-[var(--accent-glow)] text-white scale-110' 
                      : 'glass border border-[var(--border)] text-[var(--text-tertiary)]'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] absolute -bottom-6 whitespace-nowrap ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-6 glass overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: active ? '0%' : '-100%' }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full bg-gradient-to-r from-[var(--accent)] to-[var(--cyan)]"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-8"
          >
            <div className="md:col-span-3 glass-strong rounded-3xl border border-[var(--border)] p-8">
              <h2 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                <Settings size={16} className="text-[var(--accent-light)]" />
                Parameters
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Agent Call Sign</label>
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl px-6 py-4 text-sm glass border border-[var(--border)] focus:border-[var(--accent-light)] outline-none font-bold transition-all"
                    placeholder="e.g. NEURAL-ORACLE-01"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Core Capability</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CAPABILITIES.map((cap) => {
                      const info = CAP_INFO[cap];
                      const CapIcon = info.icon;
                      const isSelected = capability === cap;
                      
                      return (
                        <button
                          key={cap}
                          onClick={() => setCapability(cap)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                            isSelected 
                              ? 'glass-strong' 
                              : 'glass hover:bg-white/5'
                          }`}
                          style={{ borderColor: isSelected ? info.color : 'var(--border)' }}
                        >
                          <div 
                            className="p-2.5 rounded-xl border border-opacity-10"
                            style={{ backgroundColor: `${info.color}10`, color: isSelected ? info.color : 'var(--text-tertiary)' }}
                          >
                            <CapIcon size={18} />
                          </div>
                          <div>
                            <div className={`text-[11px] font-black uppercase tracking-widest ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>{cap}</div>
                            <div className="text-[9px] text-[var(--text-tertiary)] leading-tight mt-0.5">{info.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Stake Lockup</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={stake} 
                        onChange={(e) => setStake(Number(e.target.value))}
                        className="w-full rounded-2xl px-6 py-4 text-sm glass border border-[var(--border)] focus:border-[var(--accent-light)] outline-none font-mono font-bold"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-tertiary)]">SOM</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Daily Burn Limit</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={spendLimit} 
                        onChange={(e) => setSpendLimit(Number(e.target.value))}
                        className="w-full rounded-2xl px-6 py-4 text-sm glass border border-[var(--border)] focus:border-[var(--accent-light)] outline-none font-mono font-bold"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-tertiary)]">SOM</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(1)} 
                  disabled={!name || stake < 10}
                  className="btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Generate Manifest <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              <div className="glass-strong rounded-3xl border border-[var(--border)] p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-[0.02] blur-3xl rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-8">Node Preview</h3>
                
                <div className="relative mb-8">
                  <div 
                    className="w-24 h-24 rounded-3xl glass border border-opacity-20 flex items-center justify-center mx-auto shadow-2xl transition-transform duration-700 group-hover:rotate-12"
                    style={{ 
                      backgroundColor: `${CAP_INFO[capability].color}10`, 
                      borderColor: `${CAP_INFO[capability].color}40`,
                      color: CAP_INFO[capability].color 
                    }}
                  >
                    {(() => {
                      const Icon = CAP_INFO[capability].icon;
                      return <Icon size={40} />;
                    })()}
                  </div>
                </div>

                <h4 className="text-xl font-black uppercase tracking-tighter mb-1 truncate">{name || '---'}</h4>
                <div className="text-[10px] font-black font-mono tracking-widest text-[var(--text-tertiary)] mb-6 uppercase">{capability} UNIT</div>
                
                <div className="flex items-center justify-center gap-4 text-[10px] font-black font-mono text-[var(--text-tertiary)]">
                  <div className="flex flex-col">
                    <span>STAKE</span>
                    <span className="text-[var(--emerald)]">{stake} SOM</span>
                  </div>
                  <div className="w-[1px] h-4 bg-[var(--border)]" />
                  <div className="flex flex-col">
                    <span>STATUS</span>
                    <span className="text-[var(--amber)]">PENDING</span>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-3xl border border-[var(--border)] p-6">
                <div className="flex gap-3 items-start">
                  <Info size={16} className="text-[var(--accent-light)] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Network Note</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                      All agents require a minimum stake of 10 SOM to ensure protocol security. Staked funds are locked in escrow and released upon decommissioning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto glass-strong rounded-3xl border border-[var(--border)] p-10"
          >
            <h2 className="text-sm font-black uppercase tracking-widest mb-10 text-center">Confirm Manifest</h2>
            
            <div className="space-y-6 mb-10">
              {[
                { label: 'Identifier', value: name },
                { label: 'Core Class', value: capability, color: CAP_INFO[capability].color },
                { label: 'Collateral', value: `${stake.toFixed(1)} SOM` },
                { label: 'Daily Ceiling', value: `${spendLimit.toFixed(1)} SOM` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-4 border-b border-[var(--border)] last:border-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{item.label}</span>
                  <span className="text-sm font-black font-mono uppercase" style={{ color: item.color || 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-[var(--border)] mb-10">
              <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Gas Estimation</div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[var(--text-tertiary)]">Registration Fee</span>
                <span>~0.002 SOM</span>
              </div>
              <div className="flex justify-between text-xs font-mono font-black">
                <span className="text-[var(--text-tertiary)] text-[9px] uppercase tracking-widest">Total Commitment</span>
                <span className="text-[var(--emerald)]">{stake.toFixed(1)} SOM</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setStep(0)} 
                className="py-4 rounded-2xl border border-[var(--border)] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Reconfigure
              </button>
              <button 
                onClick={handleDeploy}
                className="btn-primary py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Initialize <Rocket size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto py-20 text-center"
          >
            <div className="relative w-24 h-24 mx-auto mb-10">
              <div className="absolute inset-0 rounded-3xl bg-[var(--accent)] opacity-20 animate-ping" />
              <div className="relative glass border border-[var(--accent)] rounded-3xl w-full h-full flex items-center justify-center text-[var(--accent-light)]">
                <Rocket size={40} className="animate-bounce" />
              </div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Broadcasting...</h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
              Synchronizing with the Somnia consensus layer. Your agent is being forged in the digital void.
            </p>
            <div className="mt-8 flex gap-2 justify-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto py-16 text-center glass-strong rounded-[3rem] border border-[var(--emerald)] p-12"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--emerald)]/10 border border-[var(--emerald)]/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_var(--emerald-glow)]">
              <CheckCircle2 size={40} className="text-[var(--emerald)]" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--emerald)] mb-4">Node Activated</h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-4">
              Deployment complete. Agent <span className="text-[var(--text-primary)] font-black">#{Math.floor(Math.random() * 9999)}</span> is now operational and awaiting computational tasks.
            </p>
            {txHash && (
              <div className="mb-8 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">Transaction</div>
                <div className="text-[10px] font-mono text-[var(--accent-light)] break-all">{txHash}</div>
              </div>
            )}
            <div className="space-y-4">
              <Link href="/dashboard" className="btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-widest block text-center">
                Command Center
              </Link>
              <button 
                onClick={() => { setStep(0); setName(''); }} 
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Provision Another Node
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
