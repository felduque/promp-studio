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
  Columns2,
  FileText,
  MessageSquare,
  Eye,
  X,
} from 'lucide-react';

// --- Types ---

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
  promptVersion?: {
    id: string;
    versionNumber: number;
    prompt?: { id: string; name: string; project?: { id: string; name: string } };
  } | null;
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
    prompt?: { id: string; name: string; project?: { id: string; name: string } };
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

interface ExecResponse {
  items: Execution[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// --- Helpers ---

const totalCost = (g: ExecutionGroup) => g.executions.reduce((s, e) => s + e.cost, 0);
const totalTokens = (g: ExecutionGroup) => g.executions.reduce((s, e) => s + e.tokensIn + e.tokensOut, 0);
const avgLatency = (g: ExecutionGroup) => {
  const f = g.executions.filter((e) => e.latencyMs > 0);
  return f.length ? f.reduce((s, e) => s + e.latencyMs, 0) / f.length : 0;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// --- Component ---

export default function HistoryPage() {
  const [tab, setTab] = useState<'groups' | 'solo'>('groups');
  const [groups, setGroups] = useState<GroupsResponse | null>(null);
  const [solos, setSolos] = useState<ExecResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedExec, setSelectedExec] = useState<Execution | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<GroupsResponse>(`/executions/groups?page=${page}&limit=15`);
      setGroups(data);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchSolos = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all executions, then filter client-side those without groupId
      const { data } = await apiClient.get<ExecResponse>(`/executions?page=${page}&limit=20`);
      // Filter only those without a group (groupId null/undefined)
      const filtered = {
        ...data,
        items: data.items.filter((e: any) => !e.groupId),
      };
      setSolos(filtered);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (tab === 'groups') fetchGroups();
    else fetchSolos();
  }, [tab, fetchGroups, fetchSolos]);

  const currentPages = tab === 'groups' ? groups?.pages ?? 1 : solos?.pages ?? 1;

  return (
    <div className="flex flex-col h-full bg-[#0b1326] overflow-y-auto ps-editor-scroll">
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
          Execution History
        </h1>
        <p className="text-[#c7c4d7] text-sm mt-1">Historial de ejecuciones y comparaciones</p>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#131b2e] p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
              tab === 'groups' ? 'bg-[#2d3449] text-[#dae2fd]' : 'text-[#c7c4d7] hover:text-[#dae2fd]'
            }`}
          >
            <Columns2 className="w-4 h-4" />
            Comparaciones
            {groups && <span className="bg-[#060e20] text-[#c0c1ff] text-[0.6rem] px-1.5 py-0.5 rounded font-mono">{groups.total}</span>}
          </button>
          <button
            onClick={() => setTab('solo')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
              tab === 'solo' ? 'bg-[#2d3449] text-[#dae2fd]' : 'text-[#c7c4d7] hover:text-[#dae2fd]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Individuales
            {solos && <span className="bg-[#060e20] text-[#c0c1ff] text-[0.6rem] px-1.5 py-0.5 rounded font-mono">{solos.total}</span>}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="border-4 border-[#c0c1ff] border-t-transparent rounded-full w-8 h-8 animate-spin" />
          </div>
        ) : tab === 'groups' ? (
          /* ---- GROUPS TAB ---- */
          groups && groups.items.length > 0 ? (
            <>
              {groups.items.map((group) => (
                <div key={group.id} className="bg-[#131b2e] rounded-xl border border-[rgba(70,69,84,0.1)] hover:border-[rgba(70,69,84,0.2)] transition-all overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#c0c1ff]/10 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5 text-[#c0c1ff]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#dae2fd] font-medium text-sm">
                            {group.models.length} modelo{group.models.length !== 1 ? 's' : ''}
                          </span>
                          {group.promptVersion?.prompt && (
                            <>
                              <span className="text-[#464554] text-xs">·</span>
                              <Link href={`/projects/${group.promptVersion.prompt.project?.id}`} className="text-[#c0c1ff] text-xs hover:text-[#8083ff] transition-colors">
                                {group.promptVersion.prompt.project?.name}
                              </Link>
                              <span className="text-[#464554] text-xs">/</span>
                              <Link href={`/projects/${group.promptVersion.prompt.project?.id}/prompts/${group.promptVersion.prompt.id}`} className="text-[#c0c1ff] text-xs hover:text-[#8083ff] transition-colors">
                                {group.promptVersion.prompt.name}
                              </Link>
                              <span className="bg-[#060e20] text-[#c0c1ff] text-[0.6rem] px-1.5 py-0.5 rounded font-[var(--font-geist-mono)]">
                                v{group.promptVersion.versionNumber}
                              </span>
                            </>
                          )}
                          {!group.promptVersion?.prompt && <span className="text-[#464554] text-xs italic">Preview</span>}
                          <span className="text-[#464554] text-xs">· {timeAgo(group.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {group.models.map((m) => (
                            <span key={m} className="bg-[#2d3449] text-[#c7c4d7] text-[0.65rem] px-2 py-0.5 rounded font-[var(--font-geist-mono)]">
                              {m.split('/').pop()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-4 text-xs text-[#c7c4d7]">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{totalTokens(group).toLocaleString()} tok</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(avgLatency(group))}ms</span>
                        <span className="flex items-center gap-1"><Coins className="w-3 h-3" />${totalCost(group).toFixed(5)}</span>
                      </div>
                      <Link href={`/history/${group.id}`} className="flex items-center gap-1.5 bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] px-4 py-2 rounded-lg text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity">
                        <Columns2 className="w-3.5 h-3.5" />
                        Comparar
                      </Link>
                    </div>
                  </div>
                  <div className="border-t border-[rgba(70,69,84,0.1)] px-6 py-3 flex gap-3 overflow-x-auto">
                    {group.executions.map((exec) => (
                      <div key={exec.id} className="flex items-center gap-2 bg-[#0b1326] rounded-lg px-3 py-2 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${exec.output ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'}`} />
                        <span className="text-xs text-[#dae2fd] font-medium max-w-[120px] truncate">{exec.model.split('/').pop()}</span>
                        <span className="text-[0.65rem] text-[#464554] font-[var(--font-geist-mono)]">{Math.round(exec.latencyMs)}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="py-20 text-center">
              <Layers className="w-10 h-10 text-[#464554] mx-auto mb-3" />
              <p className="text-[#c7c4d7] text-sm">No hay comparaciones aún</p>
              <p className="text-[#464554] text-xs mt-1">Ejecuta un prompt contra múltiples modelos para ver comparaciones aquí</p>
            </div>
          )
        ) : (
          /* ---- SOLO TAB ---- */
          solos && solos.items.length > 0 ? (
            <div className="bg-[#131b2e] rounded-xl border border-[rgba(70,69,84,0.1)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(70,69,84,0.1)]">
                    {['Fuente', 'Modelo', 'Prompt', 'Tokens', 'Latencia', 'Costo', 'Fecha', ''].map((h) => (
                      <th key={h} className={`px-4 py-3 text-[0.6875rem] uppercase tracking-widest text-[#464554] font-normal ${h === '' || h === 'Tokens' || h === 'Latencia' || h === 'Costo' || h === 'Fecha' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solos.items.map((exec) => (
                    <tr key={exec.id} className="border-b border-[rgba(70,69,84,0.05)] last:border-0 hover:bg-[#171f33] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${exec.source === 'chat' ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#c0c1ff]/10 text-[#c0c1ff]'}`}>
                          {exec.source === 'chat'
                            ? <><MessageSquare className="w-3 h-3" />Chat</>
                            : <><FileText className="w-3 h-3" />Prompt</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#dae2fd] font-medium text-xs">{exec.model.split('/').pop()}</div>
                        <div className="text-[#464554] text-[0.65rem]">{exec.provider}</div>
                      </td>
                      <td className="px-4 py-3 text-[#c7c4d7] text-xs">
                        {exec.promptVersion?.prompt ? (
                          <Link href={`/projects/${exec.promptVersion.prompt.project?.id}/prompts/${exec.promptVersion.prompt.id}`} className="text-[#c0c1ff] hover:text-[#8083ff] transition-colors">
                            {exec.promptVersion.prompt.name}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[#c7c4d7] text-xs">
                        <span className="flex justify-end items-center gap-1"><Zap className="w-3 h-3" />{(exec.tokensIn + exec.tokensOut).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#c7c4d7] text-xs">
                        <span className="flex justify-end items-center gap-1"><Clock className="w-3 h-3" />{Math.round(exec.latencyMs)}ms</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#c7c4d7] text-xs">
                        <span className="flex justify-end items-center gap-1"><Coins className="w-3 h-3" />${exec.cost.toFixed(5)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#464554] text-xs">{timeAgo(exec.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelectedExec(exec)} className="p-1.5 rounded hover:bg-[#2d3449] text-[#464554] hover:text-[#c0c1ff] transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <FileText className="w-10 h-10 text-[#464554] mx-auto mb-3" />
              <p className="text-[#c7c4d7] text-sm">No hay ejecuciones individuales</p>
            </div>
          )
        )}

        {/* Pagination */}
        {currentPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 rounded hover:bg-[#131b2e] text-[#c7c4d7] disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[#c7c4d7] text-sm">{page} / {currentPages}</span>
            <button disabled={page >= currentPages} onClick={() => setPage(page + 1)} className="p-2 rounded hover:bg-[#131b2e] text-[#c7c4d7] disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Solo execution detail modal */}
      {selectedExec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedExec(null)} />
          <div className="relative bg-[#131b2e]/95 backdrop-blur-xl border border-[rgba(70,69,84,0.15)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ps-editor-scroll">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-lg">Detalle de Ejecución</h2>
              <button onClick={() => setSelectedExec(null)} className="p-1.5 rounded hover:bg-[#2d3449] text-[#c7c4d7] hover:text-[#dae2fd] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Modelo', selectedExec.model],
                  ['Proveedor', selectedExec.provider],
                  ['Tokens (in/out)', `${selectedExec.tokensIn} / ${selectedExec.tokensOut}`],
                  ['Latencia', `${Math.round(selectedExec.latencyMs)}ms`],
                  ['Costo', `$${selectedExec.cost.toFixed(6)}`],
                  ['Fuente', selectedExec.source],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[0.6875rem] uppercase tracking-widest text-[#464554] mb-1">{label}</div>
                    <div className="text-sm text-[#dae2fd] font-medium">{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[0.6875rem] uppercase tracking-widest text-[#464554] mb-2">Respuesta</div>
                <pre className="bg-[#060e20] p-4 rounded-lg max-h-80 overflow-y-auto font-[var(--font-geist-mono)] text-sm text-[#c7c4d7] whitespace-pre-wrap ps-editor-scroll">
                  {selectedExec.output || '(sin respuesta)'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
