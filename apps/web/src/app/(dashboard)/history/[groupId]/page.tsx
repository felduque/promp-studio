'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeft,
  Clock,
  Zap,
  Coins,
  Trophy,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface Execution {
  id: string;
  provider: string;
  model: string;
  source: 'prompt' | 'chat';
  input: { messages?: Array<{ role: string; content: string }>; variables?: Record<string, string>; content?: string };
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  cost: number;
  parameters: { temperature?: number; maxTokens?: number };
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

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<ExecutionGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<ExecutionGroup>(`/executions/groups/${groupId}`);
        setGroup(data);
      } catch {
        router.push('/history');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, router]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0b1326]">
        <div className="border-4 border-[#c0c1ff] border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  const executions = group.executions.sort((a, b) => a.latencyMs - b.latencyMs);
  const fastest = executions[0];
  const cheapest = [...executions].sort((a, b) => a.cost - b.cost)[0];

  // Extract the input prompt from the first execution
  const inputPrompt = executions[0]?.input?.messages?.[0]?.content
    || (executions[0]?.input?.content as string)
    || '';

  return (
    <div className="flex flex-col h-full bg-[#0b1326] overflow-y-auto ps-editor-scroll">
      {/* Header */}
      <header className="px-8 py-6 shrink-0">
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-1.5 text-[#c7c4d7] hover:text-[#dae2fd] text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al historial
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
              Comparación de Ejecución
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {group.promptVersion?.prompt && (
                <>
                  <Link
                    href={`/projects/${group.promptVersion.prompt.project?.id}`}
                    className="text-[#c0c1ff] text-sm hover:text-[#8083ff] transition-colors"
                  >
                    {group.promptVersion.prompt.project?.name}
                  </Link>
                  <span className="text-[#464554] text-sm">/</span>
                  <Link
                    href={`/projects/${group.promptVersion.prompt.project?.id}/prompts/${group.promptVersion.prompt.id}`}
                    className="text-[#c0c1ff] text-sm hover:text-[#8083ff] transition-colors"
                  >
                    {group.promptVersion.prompt.name}
                  </Link>
                  <span className="bg-[#060e20] text-[#c0c1ff] text-[0.65rem] px-1.5 py-0.5 rounded font-[var(--font-geist-mono)]">
                    v{group.promptVersion.versionNumber}
                  </span>
                  <span className="text-[#464554] text-sm">·</span>
                </>
              )}
              <span className="text-[#464554] text-sm">
                {new Date(group.createdAt).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-[#464554] text-sm">·</span>
              <span className="text-[#464554] text-sm">{group.models.length} modelos</span>
              {group.parameters?.temperature !== undefined && (
                <span className="text-[#464554] text-sm">· T={group.parameters.temperature}</span>
              )}
            </div>
          </div>
          {executions.length > 1 && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#131b2e] px-3 py-2 rounded-lg border border-[rgba(70,69,84,0.1)]">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-[#c7c4d7]">Más rápido:</span>
                <span className="text-xs text-[#dae2fd] font-medium">{fastest?.model.split('/').pop()}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#131b2e] px-3 py-2 rounded-lg border border-[rgba(70,69,84,0.1)]">
                <Trophy className="w-3.5 h-3.5 text-[#4edea3]" />
                <span className="text-xs text-[#c7c4d7]">Más barato:</span>
                <span className="text-xs text-[#dae2fd] font-medium">{cheapest?.model.split('/').pop()}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-6">
        {/* Input prompt card */}
        {inputPrompt && (
          <div className="bg-[#060e20] rounded-xl p-5 border border-[rgba(70,69,84,0.1)]">
            <div className="text-[0.6875rem] uppercase tracking-widest text-[#464554] mb-3">
              Prompt Enviado
            </div>
            <pre className="font-[var(--font-geist-mono)] text-sm text-[#c7c4d7] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto ps-editor-scroll">
              {inputPrompt}
            </pre>
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {executions.map((exec) => {
            const isFastest = exec.id === fastest?.id && executions.length > 1;
            const isCheapest = exec.id === cheapest?.id && executions.length > 1;
            const hasOutput = !!exec.output;

            return (
              <div
                key={exec.id}
                className={`bg-[#131b2e] rounded-xl border overflow-hidden transition-all ${
                  isFastest
                    ? 'border-amber-400/30'
                    : hasOutput
                    ? 'border-[rgba(70,69,84,0.1)]'
                    : 'border-[#ffb4ab]/20'
                }`}
              >
                {/* Model header */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-[rgba(70,69,84,0.1)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasOutput ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'}`} />
                    <span className="text-sm font-medium text-[#dae2fd]">
                      {exec.model.split('/').pop()}
                    </span>
                    <span className="text-[0.65rem] text-[#464554]">{exec.provider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isFastest && (
                      <span className="bg-amber-400/10 text-amber-400 text-[0.6rem] px-1.5 py-0.5 rounded font-bold uppercase">
                        Fastest
                      </span>
                    )}
                    {isCheapest && (
                      <span className="bg-[#4edea3]/10 text-[#4edea3] text-[0.6rem] px-1.5 py-0.5 rounded font-bold uppercase">
                        Cheapest
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="px-5 py-2 flex items-center gap-4 text-[0.65rem] text-[#464554] border-b border-[rgba(70,69,84,0.05)]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(exec.latencyMs)}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {(exec.tokensIn + exec.tokensOut).toLocaleString()} tok
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    ${exec.cost.toFixed(5)}
                  </span>
                </div>

                {/* Output */}
                <div className="p-5 relative group">
                  {hasOutput ? (
                    <pre className="font-[var(--font-geist-mono)] text-sm text-[#c7c4d7] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto ps-editor-scroll">
                      {exec.output}
                    </pre>
                  ) : (
                    <div className="flex items-center gap-2 text-[#ffb4ab] text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Respuesta vacía — el modelo no generó output
                    </div>
                  )}
                  {hasOutput && (
                    <button
                      onClick={() => handleCopy(exec.output, exec.id)}
                      className="absolute top-3 right-3 p-1.5 rounded bg-[#2d3449]/80 text-[#c7c4d7] hover:text-[#dae2fd] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {copiedId === exec.id ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
