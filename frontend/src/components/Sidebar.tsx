'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  LayoutDashboard, 
  Briefcase, 
  Network, 
  FileText, 
  ChevronLeft, 
  Menu,
  Wallet
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Live Feed', icon: Activity },
  { href: '/deploy', label: 'Deploy Agent', icon: Cpu },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Job Board', icon: Briefcase },
  { href: '/network', label: 'Network', icon: Network },
  { href: '/audit-log', label: 'Audit Log', icon: FileText },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { address } = useWallet();

  return (
    <aside
      className={`fixed left-4 top-4 bottom-4 z-40 flex flex-col transition-all duration-500 ease-in-out glass rounded-2xl ${
        collapsed ? 'w-[var(--sidebar-w-collapsed)]' : 'w-[var(--sidebar-w)]'
      }`}
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--border)]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] shadow-lg shadow-[var(--accent-glow)]">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="font-bold text-lg tracking-tighter gradient-text">NEXUS</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] shadow-lg">
              <span className="text-sm font-bold text-white">N</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                collapsed ? 'justify-center' : ''
              } ${active ? 'text-[var(--accent-light)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)]'}`}
            >
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-gradient-to-r from-[rgba(124,58,237,0.1)] to-transparent rounded-xl border-l-2 border-[var(--accent)]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={20} className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? 'drop-shadow-[0_0_8px_var(--accent-glow)]' : ''}`} />
              {!collapsed && <span className="text-sm font-medium tracking-wide">{item.label}</span>}
              {collapsed && active && (
                <div className="absolute right-0 w-1 h-6 bg-[var(--accent)] rounded-l-full shadow-[0_0_10px_var(--accent-glow)]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          {collapsed ? <Menu size={20} /> : (
            <>
              <ChevronLeft size={20} />
              <span className="text-xs font-semibold uppercase tracking-widest">Collapse</span>
            </>
          )}
        </button>

        {!collapsed && address && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent border border-[rgba(16,185,129,0.1)] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--emerald)] opacity-[0.03] blur-2xl rounded-full" />
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={12} className="text-[var(--emerald)]" />
              <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--emerald)]">Connected</div>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-primary)] truncate">
              {address}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
