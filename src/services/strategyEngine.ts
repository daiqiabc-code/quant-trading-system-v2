import type { KlineData, VWAPResult, MarketStateScore, SignalScore, Signal } from '../types';

// ─── 技术指标计算 ───

export function calcEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = data[0];
  result.push(ema);
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

export function calcVWAP(klines: KlineData[]): number[] {
  let cumVP = 0;
  let cumV = 0;
  return klines.map((k) => {
    cumVP += ((k.high + k.low + k.close) / 3) * k.volume;
    cumV += k.volume;
    return cumV > 0 ? cumVP / cumV : k.close;
  });
}

export function calcATR(klines: KlineData[], period = 14): number[] {
  if (klines.length < 2) return klines.map(() => 0);
  const tr: number[] = [klines[0].high - klines[0].low];
  for (let i = 1; i < klines.length; i++) {
    const prev = klines[i - 1];
    const curr = klines[i];
    tr.push(Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    ));
  }
  const atr: number[] = [];
  let ema = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atr.push(...Array(period - 1).fill(0), ema);
  const k = 2 / (period + 1);
  for (let i = period; i < tr.length; i++) {
    ema = tr[i] * k + ema * (1 - k);
    atr.push(ema);
  }
  return atr;
}

export function calcADX(klines: KlineData[], period = 14): { adx: number[]; plusDI: number[]; minusDI: number[] } {
  if (klines.length < period + 1) {
    return { adx: klines.map(() => 0), plusDI: klines.map(() => 0), minusDI: klines.map(() => 0) };
  }
  const tr: number[] = [0];
  const upMove: number[] = [0];
  const downMove: number[] = [0];
  for (let i = 1; i < klines.length; i++) {
    const p = klines[i - 1];
    const c = klines[i];
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    upMove.push(Math.max(0, c.high - p.high));
    downMove.push(Math.max(0, p.low - c.low));
  }
  const smooth = (vals: number[], p: number): number[] => {
    const r: number[] = vals.slice(0, p).reduce((a, b) => a + b, 0);
    const result: number[] = [r];
    for (let i = p; i < vals.length; i++) {
      result.push((result[result.length - 1] - result[result.length - 1] / p + vals[i]));
    }
    return result;
  };
  const smoothTR = smooth(tr, period);
  const smoothUp = smooth(upMove, period);
  const smoothDown = smooth(downMove, period);
  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];
  for (let i = 0; i < smoothTR.length; i++) {
    const pDI = smoothTR[i] ? (smoothUp[i] / smoothTR[i]) * 100 : 0;
    const mDI = smoothTR[i] ? (smoothDown[i] / smoothTR[i]) * 100 : 0;
    plusDI.push(pDI);
    minusDI.push(mDI);
    dx.push(pDI + mDI > 0 ? Math.abs(pDI - mDI) / (pDI + mDI) * 100 : 0);
  }
  const adx = calcEMA(dx, period);
  return { adx: Array(period - 1).fill(0).concat(adx), plusDI: Array(period - 1).fill(0).concat(plusDI), minusDI: Array(period - 1).fill(0).concat(minusDI) };
}

// ─── 市场状态评分 (15分钟趋势评分 0-5) ───

export function calcMarketState(klines: KlineData[], idx: number): MarketStateScore {
  if (idx < 55) {
    return { total: 0, emaTrend: 0, emaSlope: 0, vwapSlope: 0, priceDistance: 0, adx: 0, label: 'neutral', action: 'no_trade' };
  }
  const prices = klines.slice(0, idx + 1).map((k) => k.close);
  const ema21V = calcEMA(prices, 21);
  const ema55V = calcEMA(prices, 55);
  const vwapV = calcVWAP(klines.slice(0, idx + 1));
  const adxResult = calcADX(klines.slice(0, idx + 1), 14);

  let score = 0;
  // 1) EMA21 > EMA55
  if (ema21V[idx] > ema55V[idx]) score += 1;
  // 2) EMA21 slope > 0.15%
  const slope21 = ema21V[idx] > 0 ? ((ema21V[idx] - ema21V[Math.max(0, idx - 3)]) / ema21V[idx]) * 100 : 0;
  if (slope21 > 0.15) score += 1;
  // 3) VWAP upward slope
  const vwapSlope = vwapV[idx] > 0 ? ((vwapV[idx] - vwapV[Math.max(0, idx - 3)]) / vwapV[idx]) * 100 : 0;
  if (vwapSlope > 0) score += 1;
  // 4) Price distance from VWAP: 0.2% - 1.5%
  const dist = Math.abs(klines[idx].close - vwapV[idx]) / vwapV[idx] * 100;
  if (dist >= 0.2 && dist <= 1.5) score += 1;
  // 5) ADX(14) > 20
  if (adxResult.adx[idx] > 20) score += 1;

  const label = score >= 4 ? 'strong_bull' : score >= 3 ? 'bull' : 'neutral';
  const action = score >= 5 ? 'normal' : score >= 4 ? 'reduce' : 'no_trade';

  return { total: score, emaTrend: ema21V[idx] > ema55V[idx] ? 1 : 0, emaSlope: slope21, vwapSlope, priceDistance: dist, adx: adxResult.adx[idx], label, action };
}

// ─── 信号评分 (0-100) ───

export function calcSignalScore(
  klines: KlineData[],
  idx: number,
  ms: MarketStateScore
): SignalScore {
  const prices = klines.slice(0, idx + 1).map((k) => k.close);
  const volumes = klines.slice(0, idx + 1).map((k) => k.volume);
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);

  let trendScore = Math.min(ms.total * 6, 30);
  let positionScore = ms.priceDistance >= 0.2 && ms.priceDistance <= 1.5 ? 25 : ms.priceDistance < 0.2 ? 10 : 15;
  const volRatio = avgVol > 0 ? volumes[idx] / avgVol : 0;
  let volumeScore = volRatio >= 2 ? 20 : volRatio >= 1.5 ? 15 : volRatio >= 1 ? 10 : 5;
  let orderFlowScore = klines[idx].volume > avgVol ? 15 : 8;
  let fundingScore = 8;

  const total = Math.min(trendScore + positionScore + volumeScore + orderFlowScore + fundingScore, 100);
  const grade = total >= 85 ? 'A' : total >= 70 ? 'B' : 'C';

  return { total, trendScore, positionScore, volumeScore, orderFlowScore, fundingScore, grade };
}

// ─── 信号生成 ───

let signalCounter = 0;

export function evaluateSignals(klines: KlineData[]): Signal[] {
  if (klines.length < 100) return [];
  const signals: Signal[] = [];
  const idx = klines.length - 1;
  const ms = calcMarketState(klines, idx);
  const prices = klines.map((k) => k.close);
  const ema9 = calcEMA(prices, 9);
  const ema21 = calcEMA(prices, 21);
  const ema55 = calcEMA(prices, 55);
  const vwap = calcVWAP(klines);
  const atr = calcATR(klines, 14);
  const currentATR = atr[idx] || klines[idx].close * 0.002;
  const avgVol = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);

  const now = Date.now();
  const currentPrice = klines[idx].close;

  // ── Mode 1: VWAP Trend Reversal ──
  if (ms.total >= 4 && ema21[idx] > ema55[idx] && currentATR > 0) {
    const vwapLower = vwap[idx] - currentATR * 0.8;
    const pivotLow = Math.min(...klines.slice(-5).map((k) => k.low));
    const stopLoss = Math.max(pivotLow, vwapLower);
    const entry = Math.max(klines.slice(-5).map((k) => k.high)[4] || klines[idx].high, klines[idx].close);
    const risk = Math.abs(entry - stopLoss);
    const slDistance = risk / entry;

    if (risk > 0 && slDistance > 0.001 && slDistance < 0.02) {
      const ss = calcSignalScore(klines, idx, ms);
      if (ss.grade !== 'C') {
        signalCounter++;
        signals.push({
          id: `SIG-${now}-${signalCounter}`,
          timestamp: klines[idx].time,
          type: 'long',
          mode: 'vwap_reversal',
          price: entry,
          stopLoss,
          takeProfits: [entry + risk * 1.5, entry + risk * 3, entry + risk * 5],
          grade: ss.grade,
          confidence: ss.total,
          marketScore: ms.total,
          signalScore: ss,
          active: true,
        });
      }
    }
  }

  // ── Mode 2: Liquidity Hunt Reversal ──
  if (idx >= 3) {
    const low3 = klines.slice(-3);
    const bodySizes = low3.map((k) => Math.abs(k.close - k.open));
    const wickDown = low3[2].low < low3[1].low && low3[2].low < low3[0].low;
    const wickRatio = bodySizes[2] > 0 ? (low3[2].close - low3[2].low) / bodySizes[2] : 0;
    if (wickDown && wickRatio >= 3 && ema9[idx] > ema9[idx - 1]) {
      const stopLoss = low3[2].low - currentATR * 0.5;
      const risk = Math.abs(currentPrice - stopLoss);
      if (risk > 0) {
        const ss = calcSignalScore(klines, idx, ms);
        signalCounter++;
        signals.push({
          id: `SIG-${now}-${signalCounter}`,
          timestamp: klines[idx].time,
          type: 'long',
          mode: 'liquidity_hunt',
          price: currentPrice,
          stopLoss,
          takeProfits: [currentPrice + risk * 1.5, currentPrice + risk * 3, currentPrice + risk * 5],
          grade: ss.grade,
          confidence: ss.total,
          marketScore: ms.total,
          signalScore: ss,
          active: true,
        });
      }
    }
  }

  // ── Mode 3: Momentum Breakout ──
  if (ms.total >= 4 && ema21[idx] > ema55[idx]) {
    const vah = klines.slice(-24).reduce((max, k) => Math.max(max, k.high), 0);
    const vol20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
    const currentVol = klines[idx].volume;
    if (currentPrice > vah && currentVol > avgVol * 2) {
      const ss = calcSignalScore(klines, idx, ms);
      if (ss.grade !== 'C') {
        signalCounter++;
        const stopLoss = vah - currentATR * 0.8;
        const risk = Math.abs(currentPrice - stopLoss);
        signals.push({
          id: `SIG-${now}-${signalCounter}`,
          timestamp: klines[idx].time,
          type: 'long',
          mode: 'momentum_breakout',
          price: currentPrice,
          stopLoss,
          takeProfits: [currentPrice + risk * 2, currentPrice + risk * 4, currentPrice + risk * 6],
          grade: ss.grade,
          confidence: ss.total,
          marketScore: ms.total,
          signalScore: ss,
          active: true,
        });
      }
    }
  }

  return signals;
}

export function calcIndicators(klines: KlineData[]) {
  if (klines.length < 55) {
    return { vwap: [], ema9: [], ema21: [], ema55: [], atr: [] };
  }
  const prices = klines.map((k) => k.close);
  return {
    vwap: calcVWAP(klines),
    ema9: calcEMA(prices, 9),
    ema21: calcEMA(prices, 21),
    ema55: calcEMA(prices, 55),
    atr: calcATR(klines, 14),
  };
}
