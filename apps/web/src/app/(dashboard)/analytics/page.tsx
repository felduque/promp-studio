'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Coins,
  Clock,
  Activity,
  MessageSquare,
  FileText,
  Trophy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#c0c1ff', '#8083ff', '#4edea3', '#a7b6cc', '#464554', '#39485a'];

interface Overview {
  totalExecutions: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  uniqueModels: number;
  promptExecutions: number;
  chatExecutions: number;
}

interface ModelStat {
  model: string;
  provider: string;
  source: string;
  count: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
}

interface TimelinePoint {
  date: string;
  source: string;
  count: number;
  tokens: number;
  cost: number;
}

interface LeaderboardEntry {
  model: string;
  provider: string;
  count: number;
  avgLatency: number;
  avgCost: number;
  avgRating: number | null;
  thumbsUp: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [byModel, setByModel] = useState<ModelStat[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [leaderboardCategory, setLeaderboardCategory] = useState<'quality' | 'speed' | 'cost'>('speed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, bm, tl, lb] = await Promise.all([
          apiClient.get<Overview>('/analytics/overview'),
          apiClient.get<ModelStat[]>('/analytics/by-model'),
          apiClient.get<TimelinePoint[]>(`/analytics/timeline?granularity=${granularity}`),
          apiClient.get<LeaderboardEntry[]>(`/analytics/leaderboard?category=${leaderboardCategory}`),
        ]);
        setOverview(ov.data);
        setByModel(bm.data);
        setTimeline(tl.data);
        setLeaderboard(lb.data);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    })();
  }, [granularity, leaderboardCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-ps-bg-base">
        <div className="border-4 border-ps-accent border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  const modelPieData = byModel.reduce<Record<string, number>>((acc, s) => {
    acc[s.model] = (acc[s.model] || 0) + s.count;
    return acc;
  }, {});
  const pieData = Object.entries(modelPieData).map(([name, value]) => ({ name, value }));

  const timelineAgg = timeline.reduce<Record<string, { date: string; prompt: number; chat: number; cost: number }>>((acc, t) => {
    const d = new Date(t.date).toLocaleDateString('es', { day: '2-digit', month: 'short' });
    if (!acc[d]) acc[d] = { date: d, prompt: 0, chat: 0, cost: 0 };
    if (t.source === 'prompt') acc[d].prompt += t.count;
    else acc[d].chat += t.count;
    acc[d].cost += t.cost;
    return acc;
  }, {});
  const timelineData = Object.values(timelineAgg);

  return (
    <div className="flex flex-col h-full bg-ps-bg-base overflow-y-auto ps-editor-scroll">
      {/* Header */}
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl tracking-tight">
          Analytics
        </h1>
        <p className="text-ps-text-muted text-sm mt-1">
          Resumen de uso, costos y rendimiento
        </p>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-6">
        {/* KPI Cards */}
        {overview && (
          <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Ejecuciones',
                icon: Activity,
                value: overview.totalExecutions,
                sub: (
                  <div className="flex gap-2 text-ps-text-muted text-xs">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{overview.promptExecutions} prompts</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{overview.chatExecutions} chats</span>
                  </div>
                ),
              },
              { label: 'Tokens Totales', icon: Zap, value: overview.totalTokens.toLocaleString() },
              { label: 'Costo Total', icon: Coins, value: `$${overview.totalCost.toFixed(4)}` },
              {
                label: 'Latencia Promedio',
                icon: Clock,
                value: `${Math.round(overview.avgLatency)}ms`,
                sub: <div className="text-ps-text-muted text-xs">{overview.uniqueModels} modelos usados</div>,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-5 hover:border-ps-border transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-ps-text-muted">{kpi.label}</span>
                  <kpi.icon className="w-4 h-4 text-ps-text-muted" />
                </div>
                <div className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl">
                  {kpi.value}
                </div>
                {kpi.sub}
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="gap-4 grid grid-cols-1 lg:grid-cols-2">
          {/* Timeline */}
          <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base">
                Timeline de Ejecuciones
              </h2>
              <Select value={granularity} onValueChange={(v) => setGranularity(v as any)}>
                <SelectTrigger className="w-[100px] bg-ps-bg-elevated border-ps-border text-ps-text-primary text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ps-bg-surface border-ps-border">
                  <SelectItem value="day">Día</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,52,73,0.3)" />
                  <XAxis dataKey="date" fontSize={11} stroke="#464554" />
                  <YAxis fontSize={11} stroke="#464554" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(45,52,73,0.3)', borderRadius: '8px', color: '#dae2fd' }}
                  />
                  <Bar dataKey="prompt" stackId="a" fill="#c0c1ff" name="Prompt" />
                  <Bar dataKey="chat" stackId="a" fill="#4edea3" name="Chat" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-ps-text-muted text-sm text-center">Sin datos</p>
            )}
          </div>

          {/* Model Distribution */}
          <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-6">
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base mb-4">
              Distribución por Modelo
            </h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(45,52,73,0.3)', borderRadius: '8px', color: '#dae2fd' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-ps-text-muted text-sm text-center">Sin datos</p>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-ps-border-subtle">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base">
                Leaderboard
              </h2>
            </div>
            <Select value={leaderboardCategory} onValueChange={(v) => setLeaderboardCategory(v as any)}>
              <SelectTrigger className="w-[120px] bg-ps-bg-elevated border-ps-border text-ps-text-primary text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-ps-bg-surface border-ps-border">
                <SelectItem value="quality">Calidad</SelectItem>
                <SelectItem value="speed">Velocidad</SelectItem>
                <SelectItem value="cost">Costo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4">
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.model} className="flex items-center gap-3 p-3 rounded-lg bg-ps-bg-elevated hover:bg-ps-border/30 transition-colors">
                    <span className="flex justify-center items-center bg-ps-bg-deep rounded-full w-8 h-8 font-bold text-sm text-ps-text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-ps-text-primary truncate">{entry.model}</div>
                      <div className="text-ps-text-muted text-xs">{entry.provider} · {entry.count} ejecuciones</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ps-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{Math.round(entry.avgLatency)}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3" />${entry.avgCost.toFixed(5)}
                      </span>
                      {entry.avgRating && (
                        <span className="bg-ps-accent/10 text-ps-accent px-2 py-0.5 rounded text-xs font-medium">
                          {entry.avgRating.toFixed(1)}★
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-ps-text-muted text-sm text-center">Sin datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
