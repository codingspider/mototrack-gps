// The current time, refreshed every `everyMs`, so texts like "5 min ago" keep counting while a screen stays open.
import { useEffect, useState } from 'react';

/** @param {number} everyMs How often to refresh (default 30 seconds) @returns {number} Date.now() */
export default function useNow(everyMs = 30 * 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}
