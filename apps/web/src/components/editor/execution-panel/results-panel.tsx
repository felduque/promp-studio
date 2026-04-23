'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Columns2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { ExecutionResult, CatalogModel } from './types';
import { ResultCard, Rating } from './result-card';
import { ComparisonDialog } from './comparison-dialog';
import { apiClient } from '@/lib/api-client';

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
    ? [...fulfilledResults].sort((a, b) => a.data.latencyMs - b.data.latencyMs)[0]
    : null;

  const cheapest = hasMultipleResults
    ? [...fulfilledResults].sort((a, b) => a.data.cost - b.data.cost)[0]
    : null;

  const [ratings, setRatings] = useState<Map<number, Rating>>(new Map());
  const [compareOpen, setCompareOpen] = useState(false);

  const handleRate = (index: number, rating: Rating) => {
    setRatings((prev) => {
      const next = new Map(prev);
      if (rating === null) next.delete(index);
      else next.set(index, rating);
      return next;
    });

    // Persist evaluation to backend
    const result = results[index];
    if (result?.status === 'fulfilled' && result.data?.id) {
      apiClient.post('/evaluations', {
        executionId: result.data.id,
        thumbsUp: rating === 'up' ? true : rating === 'down' ? false : null,
      }).catch(() => { /* silent */ });
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-3 p-4">
          {/* Summary bar + Compare button */}
          {hasMultipleResults && (
            <div className="flex items-center gap-2 bg-muted/30 p-2.5 border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5 text-xs">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
                    <span className="text-muted-foreground">Rápido:</span>
                    <span className="font-medium truncate">{findModel(fastest?.model ?? '')?.label ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-muted-foreground">Barato:</span>
                    <span className="font-medium truncate">{findModel(cheapest?.model ?? '')?.label ?? '—'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md font-medium text-primary-foreground text-xs transition-colors shrink-0"
              >
                <Columns2 className="w-3.5 h-3.5" />
                Comparar
              </button>
            </div>
          )}

          {/* Stacked results */}
          {results.map((result, i) => (
            <ResultCard
              key={i}
              result={result}
              index={i}
              findModel={findModel}
              copiedIndex={copiedIndex}
              onCopy={onCopy}
              rating={ratings.get(i) ?? null}
              onRate={handleRate}
            />
          ))}

          {results.length === 0 && !executing && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Play className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Selecciona modelos y ejecuta tu prompt
              </p>
              <p className="text-muted-foreground/60 text-xs">
                Los resultados aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Full-screen comparison dialog */}
      <ComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        results={results}
        allModels={allModels}
        onCopy={onCopy}
        copiedIndex={copiedIndex}
        ratings={ratings}
        onRate={handleRate}
      />
    </>
  );
}
