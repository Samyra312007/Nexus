'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createWalletClient, custom, createPublicClient, http } from 'viem';

type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window { ethereum?: EthProvider; }
}

interface WalletContextType {
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SOMNIA_CHAIN = {
  id: 50312,
  name: 'Somnia',
  nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
} as const;

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const publicClient = createPublicClient({
        chain: SOMNIA_CHAIN,
        transport: http(),
      });
      const bal = await publicClient.getBalance({ address: addr as `0x${string}` });
      setBalance(Number(bal) / 1e18 + ' SOM');
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_wallet_address');
    if (saved && typeof window !== 'undefined' && window.ethereum) {
      const walletClient = createWalletClient({
        chain: SOMNIA_CHAIN,
        transport: custom(window.ethereum),
      });
      walletClient.requestAddresses().then(([addr]) => {
        if (addr.toLowerCase() === saved.toLowerCase()) {
          setAddress(addr);
          fetchBalance(addr);
        } else {
          localStorage.removeItem('nexus_wallet_address');
        }
      }).catch(() => {
        localStorage.removeItem('nexus_wallet_address');
      });
    }
  }, [fetchBalance]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const handleAccountsChanged = (accounts: unknown) => {
      const addrs = accounts as string[];
      if (addrs.length > 0) {
        setAddress(addrs[0]);
        localStorage.setItem('nexus_wallet_address', addrs[0]);
        fetchBalance(addrs[0]);
      } else {
        setAddress(null);
        setBalance(null);
        localStorage.removeItem('nexus_wallet_address');
      }
    };
    const handleChainChanged = () => {
      if (address) fetchBalance(address);
    };
    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [address, fetchBalance]);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('No wallet found. Install MetaMask or use a Somnia-compatible wallet.');
      return;
    }
    setIsConnecting(true);
    try {
      const walletClient = createWalletClient({
        chain: SOMNIA_CHAIN,
        transport: custom(window.ethereum),
      });
      const [addr] = await walletClient.requestAddresses();
      setAddress(addr);
      localStorage.setItem('nexus_wallet_address', addr);
      await fetchBalance(addr);
    } catch (e) {
      console.error('Wallet connect failed', e);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    localStorage.removeItem('nexus_wallet_address');
  }, []);

  return (
    <WalletContext.Provider value={{ address, balance, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
