import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, LineData, BarData, Time } from 'lightweight-charts';
import type { KlineData } from '../../types';

interface Props {
  data: KlineData[];
  vwap?: number[];
  ema9?: number[];
  ema21?: number[];
  ema55?: number[];
  signals?: { time: number; type: 'long' | 'short'; grade: string }[];
  height?: number;
}

export default function KlineChart({ data, vwap, ema9, ema21, ema55, signals, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwapRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema55Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const initialDataSet = useRef(false);

  // 创建图表（只执行一次）
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: '#334155' },
        horzLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: '#334155' },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: '#334155' },
    });

    candleRef.current = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderDownColor: '#ef4444', borderUpColor: '#22c55e',
      wickDownColor: '#ef4444', wickUpColor: '#22c55e',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    volumeRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' }, priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    vwapRef.current = chart.addLineSeries({ color: '#a855f7', lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: 'VWAP' });
    ema9Ref.current = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: 'EMA9' });
    ema21Ref.current = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: 'EMA21' });
    ema55Ref.current = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: 'EMA55' });

    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      vwapRef.current = null;
      ema9Ref.current = null;
      ema21Ref.current = null;
      ema55Ref.current = null;
      initialDataSet.current = false;
    };
  }, [height]);

  // 更新数据
  useEffect(() => {
    if (!candleRef.current || data.length === 0) return;

    const toTime = (t: number): Time => t as Time;

    if (!initialDataSet.current) {
      // 首次：批量设置
      candleRef.current.setData(data.map((k) => ({ time: toTime(k.time), open: k.open, high: k.high, low: k.low, close: k.close })));
      volumeRef.current!.setData(data.map((k) => ({ time: toTime(k.time), value: k.volume, color: k.close >= k.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' })));
      if (vwap && vwap.length === data.length) vwapRef.current?.setData(data.map((k, i) => ({ time: toTime(k.time), value: vwap[i] })));
      if (ema9 && ema9.length === data.length) ema9Ref.current?.setData(data.map((k, i) => ({ time: toTime(k.time), value: ema9[i] })));
      if (ema21 && ema21.length === data.length) ema21Ref.current?.setData(data.map((k, i) => ({ time: toTime(k.time), value: ema21[i] })));
      if (ema55 && ema55.length === data.length) ema55Ref.current?.setData(data.map((k, i) => ({ time: toTime(k.time), value: ema55[i] })));
      initialDataSet.current = true;
      chartRef.current?.timeScale().fitContent();
    } else {
      // 增量更新
      const last = data[data.length - 1];
      candleRef.current.update({ time: toTime(last.time), open: last.open, high: last.high, low: last.low, close: last.close });
      volumeRef.current!.update({ time: toTime(last.time), value: last.volume, color: last.close >= last.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' });
      if (vwap && vwap.length >= data.length) vwapRef.current?.update({ time: toTime(last.time), value: vwap[vwap.length - 1] });
      if (ema9 && ema9.length >= data.length) ema9Ref.current?.update({ time: toTime(last.time), value: ema9[ema9.length - 1] });
      if (ema21 && ema21.length >= data.length) ema21Ref.current?.update({ time: toTime(last.time), value: ema21[ema21.length - 1] });
      if (ema55 && ema55.length >= data.length) ema55Ref.current?.update({ time: toTime(last.time), value: ema55[ema55.length - 1] });
    }

    if (signals && signals.length > 0) {
      candleRef.current.setMarkers(signals.map((s) => ({
        time: toTime(s.time),
        position: s.type === 'long' ? 'belowBar' as const : 'aboveBar' as const,
        color: s.type === 'long' ? '#22c55e' : '#ef4444',
        shape: s.type === 'long' ? 'arrowUp' as const : 'arrowDown' as const,
        text: `${s.grade} ${s.type === 'long' ? 'LONG' : 'SHORT'}`,
      })));
    }
  }, [data, vwap, ema9, ema21, ema55, signals]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider">
          BTC/USDT · 1分钟K线
        </h3>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-500 inline-block" /> VWAP</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> EMA9</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> EMA21</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> EMA55</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
