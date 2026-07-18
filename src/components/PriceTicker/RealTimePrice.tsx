import { useEffect, useState, useRef } from 'react';
import type { TickerData, Symbol } from '../../services/exchangeData';

interface Props {
  ticker: TickerData | null;
  symbol: Symbol;
  connected: boolean;
}

function formatPrice(price: number, sym: Symbol): string {
  const d = sym === 'SOL' ? 2 : 2;
  return price.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

const SYMBOL_LABEL: Record<Symbol, string> = {
  BTC: 'BTC/USDT 合约',
  ETH: 'ETH/USDT 合约',
  SOL: 'SOL/USDT 合约',
};

export default function RealTimePrice({ ticker, symbol, connected }: Props) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPrice = useRef(0);

  useEffect(() => {
    if (ticker && prevPrice.current > 0) {
      if (ticker.price > prevPrice.current) setFlash('up');
      else if (ticker.price < prevPrice.current) setFlash('down');
      const t = setTimeout(() => setFlash(null), 300);
      return () => clearTimeout(t);
    }
    if (ticker) prevPrice.current = ticker.price;
  }, [ticker?.price]);

  if (!ticker) {
    return (
      <div className="card flex items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse" />
        <div>
          <div className="text-sm text-market-muted">{SYMBOL_LABEL[symbol]}</div>
          <div className="text-2xl font-mono text-gray-500">---</div>
        </div>
      </div>
    );
  }

  const isUp = ticker.changePercent24h >= 0;
  const color = isUp ? 'text-green-400' : 'text-red-400';
  const bgColor = flash === 'up' ? 'bg-green-500/10' : flash === 'down' ? 'bg-red-500/10' : '';

  return (
    <div className={`card flex items-center gap-4 transition-colors duration-200 ${bgColor}`}>
      <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse-slow`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-market-muted">{SYMBOL_LABEL[symbol]}</span>
          <span className={`text-xs ${color} font-mono`}>
            {isUp ? '▲' : '▼'} {Math.abs(ticker.changePercent24h).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <span className={`text-3xl font-mono font-bold ${color} transition-colors`}>
            {formatPrice(ticker.price, symbol)}
          </span>
          <span className={`text-sm font-mono ${color}`}>
            {isUp ? '+' : ''}{ticker.change24h.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="text-right space-y-1">
        <div>
          <div className="metric-label">24h高</div>
          <div className="text-sm font-mono text-green-400">{formatPrice(ticker.high24h, symbol)}</div>
        </div>
        <div>
          <div className="metric-label">24h低</div>
          <div className="text-sm font-mono text-red-400">{formatPrice(ticker.low24h, symbol)}</div>
        </div>
        <div>
          <div className="metric-label">24h量</div>
          <div className="text-sm font-mono text-market-text">
            {(ticker.volume24h / 1000).toFixed(0)}K
          </div>
        </div>
      </div>
    </div>
  );
}
