'use client';

import { useState } from 'react';
import { WalletProvider } from "@/hooks/useWallet";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <WalletProvider>
      <div className="flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <Nav onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </WalletProvider>
  );
}
