'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  Clock,
  Zap,
  Coins,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  Columns2,
} from 'lucide-react';

interface Execution {
  id: string;
  provider: string;
  model: string;
  source: 'prompt' | 'chat';
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  cost: number;
  createdAt: string;
}

interface ExecutionGroup {
  id: string;
  models: string[];
  parameters: { temperature?: number; maxTokens?: number };
  input: Record<string, unknown>;
  executions: Execution[];
  promptVersion?: {
    id: string;
    versionNumber: number;
    prompt?: {
      id: string;
      name: string;
      project?: {
        id: string;
        name: string;
      };
    };
  } | null;
  createdAt: string;
}

interface GroupsResponse {
  items: ExecutionGroup[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function HistoryPage() {
  const [data, setData] = useState<GroupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<GroupsResponse>(
        `/executions/groups?page=${page}&limit=15`
      );
      setData(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCost = (group: ExecutionGroup) =>
    group.executions.reduce((sum, e) => sum + e.cost, 0);

  const totalTokens = (group: ExecutionGroup) =>
    group.executions.reduce((sum, e) => sum + e.tokensIn + e.tokensOut, 0);

  const avgLatency = (group: ExecutionGroup) => {
    const fulfilled = group.executions.filter((e) => e.latencyMs > 0);
    if (fulfilled.length === 0) return 0;
    return fulfilled.reduce((sum, e) => sum + e.latencyMs, 0) / fulfilled.length;
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1326] overflow-y-auto ps-editor-scroll">
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
          Execution History
        </h1>
        <p className="text-[#c7c4d7] text-sm mt-1">
          Grupos de ejecuciones comparativas
        </p>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="border-4 border-[#c0c1ff] border-t-transparent rounded-full w-8 h-8 animate-spin" />
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            {data.items.map((group) => (
              <div
                key={group.id}
                className="bg-[#131b2e] rounded-xl border border-[rgba(70,69,84,0.1)] hover:border-[rgba(70,69,84,0.2)] transition-all overflow-hidden"
              >
                {/* Group Header */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#c0c1ff]/10 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-[#c0c1ff]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#dae2fd] font-medium text-sm">
                          {group.models.length} modelo{group.models.length !== 1 ? 's' : ''}
                        </span>
                        {group.promptVersion?.prompt && (
                          <>
                            <span className="text-[#464554] text-xs">·</span>
                            <Link
                              href={`/projects/${group.promptVersion.prompt.project?.id}`}
                              className="text-[#c0c1ff] text-xs hover:text-[#8083ff] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {group.promptVersion.prompt.project?.name}
                            </Link>
                            <span className="text-[#464554] text-xs">/</span>
                            <Link
                              href={`/projects/${group.promptVersion.prompt.project?.id}/prompts/${group.promptVersion.prompt.id}`}
                              className="text-[#c0c1ff] text-xs hover:text-[#8083ff] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {group.promptVersion.prompt.name}
                            </Link>
                            <span className="bg-[#060e20] text-[#c0c1ff] text-[0.6rem] px-1.5 py-0.5 rounded font-[var(--font-geist-mono)]">
                              v{group.promptVersion.versionNumber}
                            </span>
                          </>
                        )}
                        {!group.promptVersion?.prompt && (
                          <>
                            <span className="text-[#464554] text-xs">·</span>
                            <span className="text-[#464554] text-xs italic">Preview</span>
                          </>
                        )}
                        <span className="text-[#464554] text-xs">·</span>
                        <span className="text-[#464554] text-xs">
                          {new Date(group.createdAt).toLocaleDateString('es', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {group.models.map((m) => (
                          <span
                            key={m}
                            className="bg-[#2d3449] text-[#c7c4d7] text-[0.65rem] px-2 py-0.5 rounded font-[var(--font-geist-mono)]"
                          >
                            {m.split('/').pop()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-[#c7c4d7]">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {totalTokens(group).toLocaleString()} tok
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(avgLatency(group))}ms avg
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        ${totalCost(group).toFixed(5)}
                      </span>
                    </div>

                    <Link
                      href={`/history/${group.id}`}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] px-4 py-2 rounded-lg text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity"
                    >
                      <Columns2 className="w-3.5 h-3.5" />
                      Comparar
                    </Link>
                  </div>
                </div>

                {/* Executions summary row */}
                <div className="border-t border-[rgba(70,69,84,0.1)] px-6 py-3 flex gap-4 overflow-x-auto">
                  {group.executions.map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center gap-3 bg-[#0b1326] rounded-lg px-3 py-2 min-w-0 shrink-0"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${exec.output ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'}`} />
                      <span className="text-xs text-[#dae2fd] font-medium truncate max-w-[120px]">
                        {exec.model.split('/').pop()}
                      </span>
                      <span className="text-[0.65rem] text-[#464554] font-[var(--font-geist-mono)]">
                        {Math.round(exec.latencyMs)}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded hover:bg-[#131b2e] text-[#c7c4d7] hover:text-[#dae2fd] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[#c7c4d7] text-sm">
                  {data.page} / {data.pages}
                </span>
                <button
                  disabled={page >= data.pages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded hover:bg-[#131b2e] text-[#c7c4d7] hover:text-[#dae2fd] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <Layers className="w-10 h-10 text-[#464554] mx-auto mb-3" />
            <p className="text-[#c7c4d7] text-sm">No hay ejecuciones agrupadas aún</p>
            <p className="text-[#464554] text-xs mt-1">Ejecuta un prompt contra múltiples modelos para ver comparaciones aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
