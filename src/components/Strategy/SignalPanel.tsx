import type { Signal, MarketStateScore } from '../../types';

interface Props {
  signals: Signal[];
  marketState: MarketStateScore | null;
  onClearSignals: () => void;
}

const MODE_LABELS: Record<string, string> = {
  vwap_reversal: 'VWAP回踩',
  liquidity_hunt: '流动性猎杀',
  momentum_breakout: '突破加速',
};

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400 bg-green-900/30 border-green-800',
  B: 'text-amber-400 bg-amber-900/30 border-amber-800',
  C: 'text-gray-400 bg-gray-800/30 border-gray-700',
};

export default function SignalPanel({ signals, marketState, onClearSignals }: Props) {
  const activeSignals = signals.filter((s) => s.active).slice(-10);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider">
          📡 策略信号
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            marketState?.action === 'normal' ? 'bg-green-900/30 text-green-400' :
            marketState?.action === 'reduce' ? 'bg-amber-900/30 text-amber-400' :
            'bg-red-900/30 text-red-400'
          }`}>
            仓位: {marketState?.action === 'normal' ? '正常' : marketState?.action === 'reduce' ? '减半' : '禁止'}
          </span>
          <button onClick={onClearSignals} className="text-xs text-market-muted hover:text-red-400">
            清空
          </button>
        </div>
      </div>

      {/* 市场状态评分 */}
      {marketState && (
        <div className="flex items-center gap-4 p-2 bg-slate-800/40 rounded">
          <span className="text-xs text-market-muted">趋势评分</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${
                i <= marketState.total ? 'bg-cyan-400' : 'bg-slate-700'
              }`} />
            ))}
          </div>
          <span className={`text-xs font-mono ${
            marketState.label === 'strong_bull' ? 'text-green-400' :
            marketState.label === 'bull' ? 'text-cyan-400' : 'text-gray-400'
          }`}>
            {marketState.label === 'strong_bull' ? '强势多头' :
             marketState.label === 'bull' ? '多头' : '中性'}
          </span>
        </div>
      )}

      {/* 信号列表 */}
      {activeSignals.length === 0 ? (
        <div className="text-center py-6 text-market-muted text-sm">
          等待信号生成中...
          <div className="text-xs mt-1">需要积累足够K线数据</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activeSignals.map((signal) => (
            <div key={signal.id} className={`p-2 rounded border ${GRADE_COLORS[signal.grade]} text-xs`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{MODE_LABELS[signal.mode] || signal.mode}</span>
                <div className="flex gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    signal.type === 'long' ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'
                  }`}>
                    {signal.type === 'long' ? 'LONG' : 'SHORT'}
                  </span>
                  <span className={`font-bold ${signal.grade === 'A' ? 'text-green-400' : signal.grade === 'B' ? 'text-amber-400' : 'text-gray-400'}`}>
                    {signal.grade}级
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-market-muted">
                <div>
                  入场: <span className="text-market-text font-mono">{signal.price.toFixed(2)}</span>
                </div>
                <div>
                  止损: <span className="text-red-400 font-mono">{signal.stopLoss.toFixed(2)}</span>
                </div>
                <div>
                  置信: <span className="text-cyan-400 font-mono">{signal.confidence}%</span>
                </div>
              </div>
              <div className="text-[11px] text-market-muted mt-1">
                TP: {signal.takeProfits.map((tp, i) => (
                  <span key={i} className="text-green-400 font-mono mr-2">
                    TP{i + 1}: {tp.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
