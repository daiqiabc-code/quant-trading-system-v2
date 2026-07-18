import type { MarketStateScore, SignalScore, AIScoringResult, KlineData } from '../types';

export function computeAIScore(
  marketState: MarketStateScore,
  signalScore: SignalScore | null,
  winRate: number,
  evolutionStage: number
): AIScoringResult {
  // 技术面评分 (基于市场状态)
  const technical = Math.round((marketState.total / 5) * 100);

  // 情绪面评分 (基于信号置信度)
  const sentiment = signalScore ? Math.round(signalScore.total) : 50;

  // 风险评分 (反向: 市场状态差则风险高)
  const riskBase = marketState.action === 'normal' ? 70 : marketState.action === 'reduce' ? 50 : 30;
  const risk = Math.round(riskBase + (winRate - 0.5) * 40);

  // 进化评分 (基于经验积累)
  const evolution = Math.round(Math.min(evolutionStage * 10, 100));

  // 综合评分 (加权)
  const overall = Math.round(
    technical * 0.3 + sentiment * 0.25 + risk * 0.25 + evolution * 0.2
  );

  let recommendation = '';
  if (overall >= 80) {
    recommendation = '✅ 综合条件优秀，建议执行全仓信号交易';
  } else if (overall >= 65) {
    recommendation = '⚠️ 条件良好，建议半仓执行，注意风险控制';
  } else if (overall >= 50) {
    recommendation = '🔶 条件一般，仅执行A级信号，降低仓位至30%';
  } else {
    recommendation = '❌ 条件较差，建议暂停交易，等待市场明朗';
  }

  return { overall, technical, sentiment, risk, evolution, recommendation };
}

export function calcPerformanceMetrics(trades: { result: 'win' | 'loss'; pnlPercent: number }[]) {
  if (trades.length === 0) return { winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, expectancy: 0 };
  const wins = trades.filter((t) => t.result === 'win');
  const losses = trades.filter((t) => t.result === 'loss');
  const winRate = wins.length / trades.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPercent, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnlPercent, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (winRate * avgWin) / ((1 - winRate) * avgLoss) : winRate > 0 ? 999 : 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;
  return { winRate, avgWin, avgLoss, profitFactor, expectancy };
}

export function getMarketCondition(klines: KlineData[]): string {
  if (klines.length < 20) return '数据不足';
  const prices = klines.slice(-20).map((k) => k.close);
  const volatility = prices.reduce((s, p, i) => i > 0 ? s + Math.abs(p - prices[i - 1]) : s, 0) / prices.length;
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const volPercent = (volatility / avgPrice) * 100;
  if (volPercent > 0.5) return '高波动';
  if (volPercent > 0.2) return '中等波动';
  return '低波动';
}
