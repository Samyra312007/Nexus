'use client';

import { useState, useEffect } from 'react';

export function LiveCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setDisplay(value);
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span className={`${pulse ? 'animate-count-up' : ''}`}>
      {display.toLocaleString()}{suffix}
    </span>
  );
}
