import type { BacktestMetrics } from '../../types';

interface Props {
  metrics: BacktestMetrics | null;
}

export default function BacktestDashboard({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider mb-3">
          📊 回测结果
        </h3>
        <div className="text-center py-6 text-market-muted text-sm">
          等待策略运行积累数据...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider mb-3">
        📊 回测结果
      </h3>

      {/* 核心指标网格 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricCard label="总交易" value={metrics.totalTrades.toString()} />
        <MetricCard label="胜率" value={`${(metrics.winRate * 100).toFixed(1)}%`} color={metrics.winRate >= 0.6 ? 'text-green-400' : 'text-amber-400'} />
        <MetricCard label="平均盈利" value={`${metrics.avgWin.toFixed(2)}%`} color="text-green-400" />
        <MetricCard label="平均亏损" value={`${metrics.avgLoss.toFixed(2)}%`} color="text-red-400" />
        <MetricCard label="盈亏比" value={metrics.profitFactor.toFixed(2)} color={metrics.profitFactor >= 2 ? 'text-green-400' : 'text-amber-400'} />
        <MetricCard label="最大回撤" value={`${(metrics.maxDrawdown * 100).toFixed(1)}%`} color={metrics.maxDrawdown < 0.15 ? 'text-green-400' : 'text-red-400'} />
        <MetricCard label="夏普比率" value={metrics.sharpe.toFixed(2)} color={metrics.sharpe >= 1.5 ? 'text-green-400' : 'text-amber-400'} />
        <MetricCard label="总收益率" value={`${(metrics.totalReturn * 100).toFixed(1)}%`} color={metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'} />
      </div>

      {/* 近几笔交易 */}
      {metrics.trades.length > 0 && (
        <div>
          <div className="text-xs text-market-muted mb-2">最近交易</div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {metrics.trades.slice(-10).reverse().map((trade, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <span className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                    trade.result === 'win' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
                  }`}>
                    {trade.result === 'win' ? 'WIN' : 'LOSS'}
                  </span>
                  <span className="text-market-muted">
                    {trade.direction === 'long' ? '做多' : '做空'}
                  </span>
                </div>
                <span className={`font-mono ${trade.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color = 'text-market-text' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-800/40 rounded p-2">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${color}`}>{value}</div>
    </div>
  );
}
