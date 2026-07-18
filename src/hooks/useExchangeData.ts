import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSymbolData } from '../services/exchangeData';
import type { Symbol } from '../services/exchangeData';
import type { TickerData, KlineData } from '../types';

const POLL_INTERVAL = 10000;

export function useExchangeData(symbol: Symbol) {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await fetchSymbolData(symbol);
      setTicker(data.ticker);
      setKlines(data.klines);
      setError(null);
    } catch (e) {
      setError('获取数据失败: ' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const t = setInterval(fetchAll, POLL_INTERVAL); return () => clearInterval(t); }, [fetchAll]);

  const appendKline = useCallback((kline: KlineData) => {
    setKlines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.time === kline.time) {
        const updated = [...prev];
        updated[updated.length - 1] = kline;
        return updated;
      }
      const next = [...prev, kline];
      return next.length > 500 ? next.slice(-500) : next;
    });
  }, []);

  return { ticker, klines, loading, error, appendKline, refresh: fetchAll };
}
