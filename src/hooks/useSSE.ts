'use client';
import { useEffect, useState } from 'react';

export default function useSSE<T = unknown>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data) as T);
      } catch {
        // ignore malformed payloads
      }
    };
    return () => {
      es.close();
    };
  }, [url]);

  return data;
}
