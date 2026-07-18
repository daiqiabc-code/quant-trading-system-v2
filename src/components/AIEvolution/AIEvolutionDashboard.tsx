import type { AIScoringResult, EvolutionState } from '../../types';

interface Props {
  aiScore: AIScoringResult | null;
  evolution: EvolutionState;
  onManualEvolve: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  embryonic: '🧬 胚胎期',
  juvenile: '🔬 少年期',
  mature: '🧪 成熟期',
  expert: '🏆 专家期',
};

const STAGE_COLORS: Record<string, string> = {
  embryonic: 'text-gray-400',
  juvenile: 'text-cyan-400',
  mature: 'text-amber-400',
  expert: 'text-purple-400',
};

function ScoreGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-market-muted">{label}</span>
        <span className={`font-mono font-bold ${color}`}>{value}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function AIEvolutionDashboard({ aiScore, evolution, onManualEvolve }: Props) {
  return (
    <div className="space-y-3">
      {/* AI评分卡片 */}
      <div className="card">
        <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider mb-3">
          🤖 AI 综合评分
        </h3>
        {aiScore ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#1e293b" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={aiScore.overall >= 80 ? '#22c55e' : aiScore.overall >= 65 ? '#f59e0b' : aiScore.overall >= 50 ? '#f97316' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${aiScore.overall} ${100 - aiScore.overall}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold font-mono ${
                    aiScore.overall >= 80 ? 'text-green-400' : aiScore.overall >= 65 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {aiScore.overall}
                  </span>
                </div>
              </div>
            </div>

            <ScoreGauge label="技术面" value={aiScore.technical} color="text-cyan-400" />
            <ScoreGauge label="情绪面" value={aiScore.sentiment} color="text-purple-400" />
            <ScoreGauge label="风险面" value={aiScore.risk} color="text-orange-400" />
            <ScoreGauge label="进化评分" value={aiScore.evolution} color="text-green-400" />

            <div className={`text-xs p-2 rounded mt-2 ${
              aiScore.overall >= 80 ? 'bg-green-900/20 text-green-300' :
              aiScore.overall >= 65 ? 'bg-amber-900/20 text-amber-300' :
              'bg-red-900/20 text-red-300'
            }`}>
              {aiScore.recommendation}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-market-muted text-sm">
            等待数据积累...
          </div>
        )}
      </div>

      {/* 进化引擎卡片 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-market-muted uppercase tracking-wider">
            🧬 进化引擎
          </h3>
          <button
            onClick={onManualEvolve}
            className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-400 border border-purple-800 hover:bg-purple-800/30"
          >
            强制进化
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-market-muted">发育阶段</span>
            <span className={`font-mono font-bold ${STAGE_COLORS[evolution.stage]}`}>
              {STAGE_LABELS[evolution.stage]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-market-muted">代数</span>
            <span className="font-mono text-purple-400">{evolution.generation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-market-muted">信号统计</span>
            <span className="font-mono text-market-text">
              {evolution.totalSignals}次 (胜{evolution.successfulSignals}/负{evolution.failedSignals})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-market-muted">当前胜率</span>
            <span className={`font-mono font-bold ${evolution.winRate >= 0.6 ? 'text-green-400' : 'text-amber-400'}`}>
              {(evolution.winRate * 100).toFixed(1)}%
            </span>
          </div>

          {/* 策略基因池 */}
          <div className="mt-2 pt-2 border-t border-market-border">
            <div className="text-market-muted mb-1">策略基因池</div>
            {evolution.activeStrategies.map((gene) => (
              <div key={gene.id} className="flex items-center justify-between py-0.5">
                <span className="text-market-text">{gene.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${gene.fitness * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-market-muted">
                    {(gene.fitness * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
