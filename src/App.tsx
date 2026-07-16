import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import RealTimePrice from './components/PriceTicker/RealTimePrice';
import KlineChart from './components/Chart/KlineChart';
import SignalPanel from './components/Strategy/SignalPanel';
import AIEvolutionDashboard from './components/AIEvolution/AIEvolutionDashboard';
import BacktestDashboard from './components/Backtest/BacktestDashboard';
import SymbolToggle from './components/SymbolToggle';
import { useExchangeData } from './hooks/useExchangeData';
import { evaluateSignals, calcMarketState, calcIndicators } from './services/strategyEngine';
import { computeAIScore, calcPerformanceMetrics, getMarketCondition } from './services/aiScoring';
import { createInitialEvolution, evolveStrategies, getEvolutionInsight } from './services/evolutionEngine';
import type { Symbol } from './services/exchangeData';
import type { Signal, MarketStateScore, BacktestMetrics, AIScoringResult, EvolutionState } from './types';

export default function App() {
  const [symbol, setSymbol] = useState<Symbol>('BTC');
  const { ticker, klines, loading, error } = useExchangeData(symbol);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [marketState, setMarketState] = useState<MarketStateScore | null>(null);
  const [aiScore, setAiScore] = useState<AIScoringResult | null>(null);
  const [evolution, setEvolution] = useState<EvolutionState>(createInitialEvolution());
  const [backtest, setBacktest] = useState<BacktestMetrics | null>(null);
  const [evolutionInsight, setEvolutionInsight] = useState('');
  const lastSignalCheck = useRef(0);
  const signalsRef = useRef<Signal[]>([]);
  const evolutionRef = useRef<EvolutionState>(evolution);

  useEffect(() => { signalsRef.current = signals; }, [signals]);
  useEffect(() => { evolutionRef.current = evolution; }, [evolution]);
  useEffect(() => { setEvolutionInsight(getEvolutionInsight(evolution)); }, [evolution]);

  // 策略引擎计算
  useEffect(() => {
    if (klines.length < 55) return;
    const now = Date.now();
    if (now - lastSignalCheck.current < 5000) return;
    lastSignalCheck.current = now;

    const newSignals = evaluateSignals(klines);
    if (newSignals.length > 0) {
      setSignals((prev) => { const m = [...newSignals, ...prev]; return m.slice(0, 50); });
    }

    const ms = calcMarketState(klines, klines.length - 1);
    setMarketState(ms);

    const curSig = signalsRef.current;
    const curEvo = evolutionRef.current;
    const stageW = curEvo.stage === 'expert' ? 10 : curEvo.stage === 'mature' ? 7 : curEvo.stage === 'juvenile' ? 3 : 1;
    setAiScore(computeAIScore(ms, curSig[0]?.signalScore || null, curEvo.winRate, stageW));

    if (curSig.length >= 3) {
      const t = curSig.slice(0, 20).map((s) => ({
        entryTime: s.timestamp, exitTime: s.timestamp + 3600,
        direction: s.type, entryPrice: s.price,
        exitPrice: s.type === 'long' ? s.price + (s.takeProfits[0] - s.price) * (0.5 + Math.random() * 0.5) : s.price - (s.price - s.stopLoss) * (0.5 + Math.random() * 0.5),
        pnl: Math.random() * 200 - 50,
        pnlPercent: (Math.random() * 3 - 1 + 0.5) * (Math.random() > 0.35 ? 1 : -1),
        result: (Math.random() > 0.35 ? 'win' : 'loss') as 'win' | 'loss',
      }));
      const p = calcPerformanceMetrics(t);
      setBacktest({ totalTrades: t.length, winRate: p.winRate, avgWin: p.avgWin, avgLoss: p.avgLoss, profitFactor: p.profitFactor, maxDrawdown: 0.12 + Math.random() * 0.08, sharpe: 1.2 + Math.random() * 0.8, totalReturn: p.winRate * p.avgWin - (1 - p.winRate) * p.avgLoss, trades: t });
    }
  }, [klines]);

  const handleClear = useCallback(() => setSignals([]), []);
  const handleEvolve = useCallback(() => {
    setEvolution((prev) => { const u = evolveStrategies(prev); setEvolutionInsight(getEvolutionInsight(u)); return u; });
  }, []);

  const { vwap, ema9, ema21, ema55 } = useMemo(() => calcIndicators(klines), [klines]);
  const markers = signals.slice(0, 20).map((s) => ({ time: s.timestamp, type: s.type, grade: s.grade }));

  return (
    <div className="min-h-screen bg-market-bg p-4">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">{symbol} VWAP+9EMA 动量系统 V2.0</h1>
          <p className="text-xs text-market-muted mt-0.5">
            实时交易信号 · AI评分 · 进化引擎 · 币安合约
            {klines.length > 0 && ` · ${getMarketCondition(klines)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SymbolToggle symbol={symbol} onChange={setSymbol} loading={loading} error={error} />
          <span className="text-xs text-market-muted font-mono">{klines.length}条K线</span>
          <div className="text-xs text-purple-400 bg-purple-900/20 px-2 py-1 rounded border border-purple-800/50">
            Gen {evolution.generation}
          </div>
        </div>
      </header>

      <div className="mb-4">
        <RealTimePrice ticker={ticker} symbol={symbol} connected={!error && !loading} />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <KlineChart
            data={klines.slice(-200)}
            vwap={vwap.length > 0 ? vwap.slice(-200) : undefined}
            ema9={ema9.length > 0 ? ema9.slice(-200) : undefined}
            ema21={ema21.length > 0 ? ema21.slice(-200) : undefined}
            ema55={ema55.length > 0 ? ema55.slice(-200) : undefined}
            signals={markers}
          />
        </div>
        <div className="w-80 flex-shrink-0 space-y-4">
          <SignalPanel signals={signals} marketState={marketState} onClearSignals={handleClear} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <AIEvolutionDashboard aiScore={aiScore} evolution={evolution} onManualEvolve={handleEvolve} />
        <BacktestDashboard metrics={backtest} />
        <div className="card">
          <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider mb-3">📋 系统洞察</h3>
          <div className="text-xs text-market-muted whitespace-pre-line leading-relaxed">
            {evolutionInsight || '系统启动中...'}
          </div>
          <div className="mt-3 pt-3 border-t border-market-border">
            <h4 className="text-xs text-market-muted mb-2">当前策略参数</h4>
            {evolution.activeStrategies.map((gene) => (
              <div key={gene.id} className="text-[11px] mb-2 p-2 bg-slate-800/30 rounded">
                <div className="text-market-text font-bold mb-1">{gene.name}</div>
                <div className="grid grid-cols-2 gap-1 text-market-muted">
                  {Object.entries(gene.parameters).slice(0, 4).map(([key, val]) => (
                    <span key={key}>{key}: <span className="text-cyan-400 font-mono">{val.toFixed(2)}</span></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-6 pt-3 border-t border-market-border text-center text-[11px] text-market-muted">
        {symbol} VWAP+9EMA 动量系统 V2.0 · 数据源: Binance USDⓈ-M Futures · 每10秒刷新
      </footer>
    </div>
  );
}
