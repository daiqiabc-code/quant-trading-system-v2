export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyVolume?: number;
}

export interface TickerData {
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface VWAPResult {
  vwap: number;
  upper: number;
  lower: number;
}

export interface EMATrend {
  ema9: number;
  ema21: number;
  ema55: number;
  slope21: number;
}

export interface ATRResult {
  atr: number;
}

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
}

export interface MarketStateScore {
  total: number;
  emaTrend: number;
  emaSlope: number;
  vwapSlope: number;
  priceDistance: number;
  adx: number;
  label: 'strong_bull' | 'bull' | 'neutral' | 'bear';
  action: 'normal' | 'reduce' | 'no_trade';
}

export interface SignalScore {
  total: number;
  trendScore: number;
  positionScore: number;
  volumeScore: number;
  orderFlowScore: number;
  fundingScore: number;
  grade: 'A' | 'B' | 'C';
}

export interface Signal {
  id: string;
  timestamp: number;
  type: 'long' | 'short';
  mode: 'vwap_reversal' | 'liquidity_hunt' | 'momentum_breakout';
  price: number;
  stopLoss: number;
  takeProfits: number[];
  grade: 'A' | 'B' | 'C';
  confidence: number;
  marketScore: number;
  signalScore: SignalScore;
  active: boolean;
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  result: 'win' | 'loss';
}

export interface BacktestMetrics {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpe: number;
  totalReturn: number;
  trades: BacktestTrade[];
}

export interface EvolutionState {
  generation: number;
  stage: 'embryonic' | 'juvenile' | 'mature' | 'expert';
  totalSignals: number;
  successfulSignals: number;
  failedSignals: number;
  winRate: number;
  activeStrategies: StrategyGene[];
  lastUpdated: number;
}

export interface StrategyGene {
  id: string;
  name: string;
  parameters: Record<string, number>;
  fitness: number;
  age: number;
  mutations: number;
}

export interface AIScoringResult {
  overall: number;
  technical: number;
  sentiment: number;
  risk: number;
  evolution: number;
  recommendation: string;
}
