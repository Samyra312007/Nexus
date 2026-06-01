'use client';

import { useState } from 'react';
import { WalletProvider } from "@/hooks/useWallet";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { Scene3D } from "@/components/3d/Scene3D";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <WalletProvider>
      <Scene3D />
      <div className="flex relative z-10 min-h-screen">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`flex-1 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'ml-24' : 'ml-64'} mr-4 my-4 rounded-3xl overflow-hidden`}>
          <div className="min-h-full glass rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col">
            <Nav onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
