import { useEffect, useState } from 'react';

// Re-renders every `intervalMs` while `enabled`, returning the current timestamp
const useNow = (intervalMs = 1000, enabled = true) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
};

export default useNow;
