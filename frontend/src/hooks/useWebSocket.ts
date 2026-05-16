'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FeedEvent } from '@/lib/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function connect() {
      const socket = new WebSocket(WS_URL);
      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };
      socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'connected') return;
          setEvents((prev) => [{ ...data, time: 'just now' }, ...prev].slice(0, 200));
        } catch { /* ignore */ }
      };
      ws.current = socket;
    }
    connect();
    return () => ws.current?.close();
  }, []);

  return { events, connected };
}
