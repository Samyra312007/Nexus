'use client';

import { useState, useCallback } from 'react';
import { createWalletClient, custom, createPublicClient, http } from 'viem';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EthProvider = { request: (args: { method: string; params?: any[] }) => Promise<any>; on?: (event: string, cb: (...args: any[]) => void) => void; removeListener?: (event: string, cb: (...args: any[]) => void) => void; };

declare global {
  interface Window { ethereum?: EthProvider; }
}

const SOMNIA_CHAIN = {
  id: 50312,
  name: 'Somnia',
  nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
} as const;

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('No wallet found. Install MetaMask or use a Somnia-compatible wallet.');
      return;
    }
    try {
      const walletClient = createWalletClient({
        chain: SOMNIA_CHAIN,
        transport: custom(window.ethereum),
      });
      const [addr] = await walletClient.requestAddresses();
      setAddress(addr);

      const publicClient = createPublicClient({
        chain: SOMNIA_CHAIN,
        transport: http(),
      });
      const bal = await publicClient.getBalance({ address: addr as `0x${string}` });
      setBalance(Number(bal) / 1e18 + ' SOM');
    } catch (e) {
      console.error('Wallet connect failed', e);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
  }, []);

  return { address, balance, connect, disconnect };
}
