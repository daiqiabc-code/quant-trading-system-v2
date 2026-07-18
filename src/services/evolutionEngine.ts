import type { EvolutionState, StrategyGene, Signal } from '../types';

const DEFAULT_PARAMS: Record<string, StrategyGene> = {
  vwap_reversal: {
    id: 'gene_vwap',
    name: 'VWAP趋势回踩',
    parameters: { emaPeriod: 9, atrMultiplier: 0.8, tp1: 1.5, tp2: 3, tp3: 5, scoreMin: 70 },
    fitness: 0.5,
    age: 0,
    mutations: 0,
  },
  liquidity_hunt: {
    id: 'gene_liquidity',
    name: '流动性猎杀反转',
    parameters: { wickRatio: 3, atrStopOffset: 0.5, liquidationMultiplier: 3, scoreMin: 65 },
    fitness: 0.5,
    age: 0,
    mutations: 0,
  },
  momentum_breakout: {
    id: 'gene_momentum',
    name: '突破加速模型',
    parameters: { volMultiplier: 2, atrStopOffset: 0.8, tp1: 2, tp2: 4, tp3: 6, scoreMin: 75 },
    fitness: 0.5,
    age: 0,
    mutations: 0,
  },
};

export function createInitialEvolution(): EvolutionState {
  return {
    generation: 1,
    stage: 'embryonic',
    totalSignals: 0,
    successfulSignals: 0,
    failedSignals: 0,
    winRate: 0,
    activeStrategies: Object.values(DEFAULT_PARAMS).map((g) => ({ ...g })),
    lastUpdated: Date.now(),
  };
}

export function recordSignalOutcome(
  evo: EvolutionState,
  signal: Signal,
  result: 'win' | 'loss',
  pnlPercent: number
): EvolutionState {
  const updated = { ...evo, totalSignals: evo.totalSignals + 1 };
  if (result === 'win') {
    updated.successfulSignals = evo.successfulSignals + 1;
  } else {
    updated.failedSignals = evo.failedSignals + 1;
  }
  updated.winRate = updated.totalSignals > 0
    ? updated.successfulSignals / updated.totalSignals
    : 0;

  // Update gene fitness
  updated.activeStrategies = updated.activeStrategies.map((gene) => {
    if (gene.id.includes(signal.mode)) {
      const fitnessDelta = result === 'win' ? pnlPercent * 0.1 : -0.05;
      return {
        ...gene,
        fitness: Math.max(0.1, Math.min(1, gene.fitness + fitnessDelta)),
        age: gene.age + 1,
      };
    }
    return gene;
  });

  // Evolution stage
  if (updated.totalSignals >= 50) updated.stage = 'expert';
  else if (updated.totalSignals >= 20) updated.stage = 'mature';
  else if (updated.totalSignals >= 5) updated.stage = 'juvenile';

  updated.lastUpdated = Date.now();
  return updated;
}

export function evolveStrategies(evo: EvolutionState): EvolutionState {
  if (evo.stage === 'embryonic') return evo;

  const updated = { ...evo, generation: evo.generation + 1 };
  const genes = [...updated.activeStrategies];

  for (let i = 0; i < genes.length; i++) {
    if (genes[i].fitness < 0.3 && genes[i].age > 5) {
      // Crossover with best gene
      const best = [...genes].sort((a, b) => b.fitness - a.fitness)[0];
      const candidate = { ...best, id: `${genes[i].id}_gen${updated.generation}` };
      candidate.fitness = best.fitness * 0.8;
      candidate.age = 0;
      candidate.mutations = genes[i].mutations + 1;
      // Mutate one parameter slightly
      const paramKeys = Object.keys(candidate.parameters);
      const key = paramKeys[Math.floor(Math.random() * paramKeys.length)];
      candidate.parameters[key] = candidate.parameters[key] * (0.9 + Math.random() * 0.2);
      genes[i] = candidate;
    } else {
      // Minor mutation
      genes[i].age += 1;
      if (Math.random() < 0.1) {
        const paramKeys = Object.keys(genes[i].parameters);
        const key = paramKeys[Math.floor(Math.random() * paramKeys.length)];
        genes[i].parameters[key] = genes[i].parameters[key] * (0.95 + Math.random() * 0.1);
        genes[i].mutations += 1;
      }
    }
  }

  updated.activeStrategies = genes;
  updated.lastUpdated = Date.now();
  return updated;
}

export function getEvolutionInsight(evo: EvolutionState): string {
  const insights: string[] = [];
  if (evo.stage === 'embryonic') {
    insights.push('🧬 进化初期：积累信号数据中，至少需要5次信号记录启动进化');
  } else if (evo.stage === 'juvenile') {
    insights.push('🔬 少年期：已积累基础经验，开始策略优化');
  } else if (evo.stage === 'mature') {
    insights.push('🧪 成熟期：策略自动交叉变异，优胜劣汰中');
  } else {
    insights.push('🏆 专家期：策略已高度适应市场，持续微调中');
  }
  const best = evo.activeStrategies.sort((a, b) => b.fitness - a.fitness)[0];
  if (best) {
    insights.push(`🌟 最佳策略: ${best.name} (适应度 ${(best.fitness * 100).toFixed(1)}%)`);
  }
  if (evo.winRate > 0) {
    const trend = evo.winRate >= 0.6 ? '📈 系统表现向上' : '📉 系统需要调整参数';
    insights.push(`${trend} | 胜率: ${(evo.winRate * 100).toFixed(1)}%`);
  }
  return insights.join('\n');
}
