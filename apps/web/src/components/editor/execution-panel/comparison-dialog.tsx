'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock,
  Zap,
  Coins,
  Copy,
  Check,
  Eye,
  Code,
  Download,
  FileText,
  Hash,
  Type,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  ArrowUpDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExecutionResult, CatalogModel } from './types';
import { Rating } from './result-card';

const MAX_COMPARE = 4;

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: ExecutionResult[];
  allModels: CatalogModel[];
  onCopy: (text: string, index: number) => void;
  copiedIndex: number | null;
  ratings: Map<number, Rating>;
  onRate: (index: number, rating: Rating) => void;
}

type ViewMode = 'preview' | 'raw';
type SortKey = 'default' | 'latency' | 'cost' | 'tokens';

function countStats(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  return { chars, words, lines };
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ComparisonDialog({
  open,
  onOpenChange,
  results,
  allModels,
  onCopy,
  copiedIndex,
  ratings,
  onRate,
}: ComparisonDialogProps) {
  const findModel = (id: string): CatalogModel | undefined =>
    allModels.find((m) => m.id === id);

  const fulfilledResults = results
    .map((r, i) => ({ ...r, originalIndex: i }))
    .filter((r) => r.status === 'fulfilled' && !!r.data);

  // Which results are selected for comparison (by original index)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [globalViewMode, setGlobalViewMode] = useState<ViewMode>('preview');
  const [sortKey, setSortKey] = useState<SortKey>('default');

  // Reset selection when dialog opens or results change
  useEffect(() => {
    if (open) {
      const initial = new Set(
        fulfilledResults.slice(0, MAX_COMPARE).map((r) => r.originalIndex)
      );
      setSelectedIndices(initial);
    }
  }, [open, results.length]);

  const toggleIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else if (next.size < MAX_COMPARE) {
        next.add(idx);
      }
      return next;
    });
  };

  // Get sorted selected results
  const comparedResults = fulfilledResults
    .filter((r) => selectedIndices.has(r.originalIndex))
    .sort((a, b) => {
      if (sortKey === 'latency') return (a.data?.latencyMs ?? 0) - (b.data?.latencyMs ?? 0);
      if (sortKey === 'cost') return (a.data?.cost ?? 0) - (b.data?.cost ?? 0);
      if (sortKey === 'tokens') return (a.data?.tokensOut ?? 0) - (b.data?.tokensOut ?? 0);
      return 0;
    });

  // Find best in each category
  const bestLatency = comparedResults.length > 1
    ? [...comparedResults].sort((a, b) => (a.data?.latencyMs ?? 0) - (b.data?.latencyMs ?? 0))[0]?.originalIndex
    : null;
  const bestCost = comparedResults.length > 1
    ? [...comparedResults].sort((a, b) => (a.data?.cost ?? 0) - (b.data?.cost ?? 0))[0]?.originalIndex
    : null;
  const bestTokens = comparedResults.length > 1
    ? [...comparedResults].sort((a, b) => (a.data?.tokensOut ?? 0) - (b.data?.tokensOut ?? 0))[0]?.originalIndex
    : null;

  // Synced scroll
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrolling = useRef(false);

  const handleScroll = useCallback((sourceIdx: number) => {
    if (scrolling.current) return;
    scrolling.current = true;
    const source = columnRefs.current[sourceIdx];
    if (!source) { scrolling.current = false; return; }
    const { scrollTop } = source;
    columnRefs.current.forEach((el, i) => {
      if (el && i !== sourceIdx) el.scrollTop = scrollTop;
    });
    requestAnimationFrame(() => { scrolling.current = false; });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0! w-[95vw]! max-w-[95vw]! h-[90vh] max-h-[90vh]">
        {/* Header */}
        <div className="space-y-2 px-4 py-2.5 border-b shrink-0">
          {/* Row 1: Title */}
          <DialogHeader className="space-y-0 p-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
              Comparación de modelos
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{comparedResults.length}/{fulfilledResults.length}</Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Row 2: Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Global view mode */}
            <div className="flex items-center bg-muted border rounded-md overflow-hidden">
              <button
                className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                  globalViewMode === 'preview'
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setGlobalViewMode('preview')}
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <div className="bg-border w-px h-4" />
              <button
                className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                  globalViewMode === 'raw'
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setGlobalViewMode('raw')}
              >
                <Code className="w-3 h-3" />
                Raw
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-muted px-2 py-1 border rounded h-7 text-xs"
            >
              <option value="default">Orden original</option>
              <option value="latency">Más rápido</option>
              <option value="cost">Más barato</option>
              <option value="tokens">Menos tokens</option>
            </select>
          </div>
        </div>

        {/* Model selector strip */}
        <div className="flex items-center gap-2 bg-muted/30 px-5 py-2 border-b overflow-x-auto shrink-0">
          <span className="text-muted-foreground text-xs shrink-0">Comparar:</span>
          {fulfilledResults.map((r) => {
            const checked = selectedIndices.has(r.originalIndex);
            const disabled = !checked && selectedIndices.size >= MAX_COMPARE;
            return (
              <label
                key={r.originalIndex}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors shrink-0 border ${
                  checked
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : disabled
                    ? 'opacity-40 cursor-not-allowed border-transparent'
                    : 'hover:bg-muted border-transparent text-muted-foreground'
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggleIndex(r.originalIndex)}
                />
                {findModel(r.model)?.label ?? r.model}
              </label>
            );
          })}
          {selectedIndices.size >= MAX_COMPARE && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              Máx {MAX_COMPARE} modelos
            </span>
          )}
        </div>

        {/* Columns area */}
        {comparedResults.length === 0 ? (
          <div className="flex flex-1 justify-center items-center text-muted-foreground text-sm">
            Selecciona al menos un modelo para comparar
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
            {comparedResults.map((result, colIdx) => {
              const output = result.data?.output ?? '';
              const stats = result.data ? countStats(output) : null;
              const oi = result.originalIndex;
              const modelLabel = findModel(result.model)?.label ?? result.model;
              const isBestLatency = bestLatency === oi;
              const isBestCost = bestCost === oi;
              const isBestTokens = bestTokens === oi;

              return (
                <div
                  key={oi}
                  className={`flex flex-col flex-1 min-w-70 ${colIdx > 0 ? 'border-l' : ''}`}
                >
                  {/* Column header */}
                  <div className="space-y-1.5 bg-muted/20 px-3 py-2 border-b shrink-0">
                    {/* Row 1: Model name + actions */}
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-semibold text-xs truncate" title={modelLabel}>
                        {modelLabel}
                      </span>
                      <div className="flex items-center shrink-0">
                        <button
                          className={`p-1 rounded transition-colors ${
                            ratings.get(oi) === 'up'
                              ? 'bg-green-500/20 text-green-500'
                              : 'hover:bg-muted text-muted-foreground hover:text-green-500'
                          }`}
                          onClick={() => onRate(oi, ratings.get(oi) === 'up' ? null : 'up')}
                          title="Buena respuesta"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          className={`p-1 rounded transition-colors ${
                            ratings.get(oi) === 'down'
                              ? 'bg-red-500/20 text-red-500'
                              : 'hover:bg-muted text-muted-foreground hover:text-red-500'
                          }`}
                          onClick={() => onRate(oi, ratings.get(oi) === 'down' ? null : 'down')}
                          title="Mala respuesta"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <div className="mx-0.5 bg-border w-px h-3" />
                        <button
                          className="hover:bg-muted p-1 rounded text-muted-foreground transition-colors"
                          onClick={() => onCopy(output, oi)}
                          title="Copiar"
                        >
                          {copiedIndex === oi ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          className="hover:bg-muted p-1 rounded text-muted-foreground transition-colors"
                          onClick={() => downloadText(output, `${modelLabel.replace(/\s+/g, '-')}-response.md`)}
                          title="Descargar"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* Row 2: Metrics as grid */}
                    {result.data && (
                      <div className="gap-1 grid grid-cols-3 text-[10px]">
                        <div className={`flex items-center gap-0.5 ${isBestLatency ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                          {isBestLatency && <Trophy className="w-2.5 h-2.5 shrink-0" />}
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{Math.round(result.data.latencyMs)}ms</span>
                        </div>
                        <div className={`flex items-center gap-0.5 ${isBestCost ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                          {isBestCost && <Trophy className="w-2.5 h-2.5 shrink-0" />}
                          <Coins className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">${result.data.cost.toFixed(4)}</span>
                        </div>
                        <div className={`flex items-center gap-0.5 ${isBestTokens ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                          {isBestTokens && <Trophy className="w-2.5 h-2.5 shrink-0" />}
                          <Zap className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{result.data.tokensIn + result.data.tokensOut} tok</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scrollable content */}
                  <div
                    ref={(el) => { columnRefs.current[colIdx] = el; }}
                    className="flex-1 min-h-0 overflow-y-auto"
                    onScroll={() => handleScroll(colIdx)}
                  >
                    {globalViewMode === 'preview' ? (
                      <div className="dark:prose-invert prose-pre:m-0 p-3 prose-pre:p-0 max-w-none prose-code:before:content-none prose-code:after:content-none prose prose-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeStr = String(children).replace(/\n$/, '');
                              if (match) {
                                return (
                                  <div className="group/code relative my-2">
                                    <div className="flex justify-between items-center bg-[#282c34] px-3 py-1 rounded-t text-gray-400 text-xs">
                                      <span>{match[1]}</span>
                                      <button
                                        className="opacity-0 group-hover/code:opacity-100 hover:text-white transition-opacity"
                                        onClick={() => onCopy(codeStr, oi)}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      PreTag="div"
                                      customStyle={{
                                        margin: 0,
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {codeStr}
                                    </SyntaxHighlighter>
                                  </div>
                                );
                              }
                              return (
                                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            table({ children }) {
                              return (
                                <div className="my-2 overflow-x-auto">
                                  <table className="w-full text-sm">{children}</table>
                                </div>
                              );
                            },
                          }}
                        >
                          {output}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="bg-muted/20 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {output}
                      </pre>
                    )}
                  </div>

                  {/* Stats footer */}
                  {stats && (
                    <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 border-t text-[10px] text-muted-foreground shrink-0">
                      <span className="flex items-center gap-0.5">
                        <Type className="w-2.5 h-2.5" />
                        {stats.words} pal.
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5" />
                        {stats.chars.toLocaleString()} chr
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FileText className="w-2.5 h-2.5" />
                        {stats.lines} lín.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
