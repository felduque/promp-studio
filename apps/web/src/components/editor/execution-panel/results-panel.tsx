'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Zap, Coins, AlertCircle, Copy, Check } from 'lucide-react';
import { ExecutionResult, CatalogModel } from './types';

interface ResultsPanelProps {
  results: ExecutionResult[];
  allModels: CatalogModel[];
  copiedIndex: number | null;
  executing: boolean;
  onCopy: (text: string, index: number) => void;
}

export function ResultsPanel({
  results,
  allModels,
  copiedIndex,
  executing,
  onCopy,
}: ResultsPanelProps) {
  const findModel = (id: string): CatalogModel | undefined =>
    allModels.find((m) => m.id === id);

  const fulfilledResults = results.filter(
    (r): r is ExecutionResult & { status: 'fulfilled'; data: NonNullable<ExecutionResult['data']> } =>
      r.status === 'fulfilled' && !!r.data
  );

  const hasMultipleResults = results.length > 1 && fulfilledResults.length > 0;

  const fastest = hasMultipleResults
    ? fulfilledResults.sort((a, b) => a.data.latencyMs - b.data.latencyMs)[0]
    : null;

  const cheapest = hasMultipleResults
    ? fulfilledResults.sort((a, b) => a.data.cost - b.data.cost)[0]
    : null;

  const leastTokens = hasMultipleResults
    ? fulfilledResults.sort((a, b) => a.data.tokensOut - b.data.tokensOut)[0]
    : null;

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-3 p-3">
        {/* Summary bar */}
        {hasMultipleResults && (
          <div className="bg-muted/30 p-2.5 border rounded-lg">
            <p className="mb-2 font-medium text-[10px] text-muted-foreground">
              Comparación rápida
            </p>
            <div className="gap-2 grid grid-cols-3 text-[10px]">
              <div>
                <span className="text-muted-foreground">Más rápido</span>
                <p className="font-medium truncate">
                  {findModel(fastest?.model ?? '')?.label ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Más barato</span>
                <p className="font-medium truncate">
                  {findModel(cheapest?.model ?? '')?.label ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Menos tokens</span>
                <p className="font-medium truncate">
                  {findModel(leastTokens?.model ?? '')?.label ?? '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Individual results */}
        {results.map((result, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={result.status === 'fulfilled' ? 'default' : 'destructive'}
              >
                {findModel(result.model)?.label ?? result.model}
              </Badge>
              {result.data && (
                <div className="flex items-center gap-2 ml-auto text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {Math.round(result.data.latencyMs)}ms
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-3 h-3" />
                    {result.data.tokensIn + result.data.tokensOut} tok
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Coins className="w-3 h-3" />
                    ${result.data.cost.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {result.status === 'fulfilled' && result.data ? (
              <div className="group relative">
                <div className="bg-muted/50 border rounded max-h-64 overflow-y-auto">
                  <pre className="p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {result.data.output}
                  </pre>
                </div>
                <button
                  className="top-1 right-1 absolute hover:bg-background opacity-0 group-hover:opacity-100 shadow-sm p-1.5 border rounded-md transition-all"
                  onClick={() => onCopy(result.data!.output, i)}
                  title="Copiar respuesta"
                >
                  {copiedIndex === i ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-4 h-4" />
                {result.error || 'Error desconocido'}
              </div>
            )}
          </div>
        ))}

        {results.length === 0 && !executing && (
          <p className="py-8 text-muted-foreground text-xs text-center">
            Selecciona modelos y ejecuta tu prompt.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
