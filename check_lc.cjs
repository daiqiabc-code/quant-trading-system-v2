const lc = require('./node_modules/lightweight-charts/index.cjs');
const keys = Object.keys(lc).sort();
console.log('=== LC Exports ===');
keys.forEach(k => console.log(`${k}: ${typeof lc[k]}`));
