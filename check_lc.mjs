const lc = require('./node_modules/lightweight-charts/index.cjs');
console.log('All exports:', Object.keys(lc).join(', '));
console.log('CandlestickSeries:', typeof lc.CandlestickSeries);
console.log('HistogramSeries:', typeof lc.HistogramSeries);
console.log('LineSeries:', typeof lc.LineSeries);
console.log('createChart:', typeof lc.createChart);
console.log('ColorType:', typeof lc.ColorType);
// Check chart method
const chart = lc.createChart(null, { width: 1, height: 1 });
console.log('chart methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)).filter(k => k.startsWith('add')).join(', '));
chart.remove();
