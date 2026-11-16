import { useCallback, useEffect, useState } from 'react';

/** Small data hook: { data, loading, error, reload }. Every screen gets loading / empty / error states from it. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setLoading(false);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { data, loading, error, reload: run, setData };
}
