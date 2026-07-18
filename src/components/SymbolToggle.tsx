import type { Symbol } from '../services/exchangeData';

interface Props {
  symbol: Symbol;
  onChange: (s: Symbol) => void;
  loading: boolean;
  error: string | null;
}

const SYMBOLS: { key: Symbol; label: string; color: string }[] = [
  { key: 'BTC', label: 'BTC/USDT', color: 'text-amber-400' },
  { key: 'ETH', label: 'ETH/USDT', color: 'text-blue-400' },
  { key: 'SOL', label: 'SOL/USDT', color: 'text-purple-400' },
];

export default function SymbolToggle({ symbol, onChange, loading, error }: Props) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
      {SYMBOLS.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
            symbol === s.key
              ? `${s.color} bg-slate-700/80 shadow-sm`
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {s.label}
        </button>
      ))}
      <div className="flex items-center gap-1.5 ml-1 px-2">
        {loading ? (
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        ) : error ? (
          <div className="w-2 h-2 rounded-full bg-red-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
        )}
        <span className={`text-[11px] ${
          error ? 'text-red-400' : loading ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {error ? '错误' : loading ? '加载中' : '合约'}
        </span>
      </div>
    </div>
  );
}
