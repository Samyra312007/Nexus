'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';

const navItems = [
  { href: '/', label: 'Live Feed', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-4a5 5 0 100-10 5 5 0 000 10zm0-3a2 2 0 100-4 2 2 0 000 4z' },
  { href: '/deploy', label: 'Deploy', icon: 'M5 10l7-8 7 8M12 2v13M5 18h14' },
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z' },
  { href: '/marketplace', label: 'Jobs', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/network', label: 'Network', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/audit-log', label: 'Audit Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { address } = useWallet();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0D0E15] border-r border-[#2D3148] z-40 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-56'}`}
    >
      <div className="h-14 flex items-center justify-between px-3 border-b border-[#2D3148]">
        {!collapsed && (
          <span className="text-lg font-bold" style={{ color: '#6C5CE7' }}>NEXUS</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-[#1E1F2B] transition-colors text-[#636E72] hover:text-white"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
            ) : (
              <><line x1="17" y1="6" x2="12" y2="12" /><line x1="12" y1="12" x2="17" y2="18" /></>
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-[#6C5CE7]/10 text-[#6C5CE7]'
                  : 'text-[#A0A3B1] hover:bg-[#1E1F2B] hover:text-white'
              }`}
              title={item.label}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d={item.icon} />
              </svg>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && address && (
        <div className="px-4 py-3 border-t border-[#2D3148]">
          <div className="text-xs text-[#636E72]">Connected</div>
          <div className="text-xs text-[#00B894] font-mono truncate">{address.slice(0, 6)}...{address.slice(-4)}</div>
        </div>
      )}
    </aside>
  );
}
