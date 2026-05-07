import { useCallback, useEffect, useState } from 'react';

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T | (() => T),
) {
  const getInitial = () =>
    typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;

  const [value, setValue] = useState<T>(() => readFromStorage(key, getInitial()));

  const setValueAndStore = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Ignore storage failures (quota, privacy mode, etc.)
        }
        return resolved;
      });
    },
    [key],
  );

  useEffect(() => {
    setValue(readFromStorage(key, getInitial()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setValue(readFromStorage(key, getInitial()));
    };

    globalThis.addEventListener('storage', handleStorage);
    return () => globalThis.removeEventListener('storage', handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValueAndStore] as const;
}
