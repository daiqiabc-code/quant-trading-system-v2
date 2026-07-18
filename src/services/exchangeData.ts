import type { TickerData, KlineData } from '../types';

export type Symbol = 'BTC' | 'ETH' | 'SOL';

const SYMBOL_CONFIG: Record<Symbol, { fapi: string; precision: number }> = {
  BTC: { fapi: 'BTCUSDT', precision: 2 },
  ETH: { fapi: 'ETHUSDT', precision: 2 },
  SOL: { fapi: 'SOLUSDT', precision: 2 },
};

// Binance USDⓈ-M Futures API (合约)
const FAPI = 'https://fapi.binance.com';

function parseTicker(data: any, precision: number): TickerData {
  return {
    price: parseFloat(data.lastPrice),
    change24h: parseFloat(data.priceChange),
    changePercent24h: parseFloat(data.priceChangePercent),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
    volume24h: parseFloat(data.volume),
  };
}

function parseKlines(data: any[]): KlineData[] {
  return data.map((k: any[]) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

export interface ExchangeData {
  ticker: TickerData;
  klines: KlineData[];
}

export async function fetchSymbolData(symbol: Symbol): Promise<ExchangeData> {
  const cfg = SYMBOL_CONFIG[symbol];
  const [tickerRes, klinesRes] = await Promise.all([
    fetch(`${FAPI}/fapi/v1/ticker/24hr?symbol=${cfg.fapi}`),
    fetch(`${FAPI}/fapi/v1/klines?symbol=${cfg.fapi}&interval=1m&limit=200`),
  ]);
  const [tickerData, klinesData] = await Promise.all([
    tickerRes.json(),
    klinesRes.json(),
  ]);
  return {
    ticker: parseTicker(tickerData, cfg.precision),
    klines: parseKlines(klinesData),
  };
}
