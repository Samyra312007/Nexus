'use client';

import { useWallet } from "@/hooks/useWallet";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, ChevronDown, Bell } from "lucide-react";
import { useState } from "react";

export function Nav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { address, balance, connect, disconnect, isConnecting } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="h-20 px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">System Status</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)] shadow-[0_0_8px_var(--emerald-glow)] animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--emerald)] uppercase tracking-wider">All Systems Operational</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)] transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-deep)]" />
        </button>

        <div className="h-8 w-[1px] bg-[var(--border)]" />

        {address ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl glass-strong hover:border-[var(--accent-light)] transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] flex items-center justify-center shadow-lg">
                <Wallet size={16} className="text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-mono text-[var(--text-primary)] leading-none mb-1">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] leading-none uppercase tracking-wider group-hover:text-[var(--accent-light)]">
                  {balance || '0.00'} SOM
                </span>
              </div>
              <ChevronDown size={14} className={`text-[var(--text-tertiary)] transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 glass-strong rounded-2xl border border-[var(--border-bright)] p-2 shadow-2xl overflow-hidden"
                >
                  <button
                    onClick={disconnect}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(239,68,68,0.1)] text-[var(--text-secondary)] hover:text-[var(--rose)] transition-all group"
                  >
                    <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Disconnect</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="btn-primary px-6 py-2.5 rounded-2xl text-sm font-bold tracking-tight disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting</span>
              </div>
            ) : (
              'Initialize Wallet'
            )}
          </button>
        )}
      </div>
    </nav>
  );
}
