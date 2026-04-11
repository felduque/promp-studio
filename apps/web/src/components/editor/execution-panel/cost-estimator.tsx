'use client';

import { TrendingUp } from 'lucide-react';
import { CatalogModel } from './types';
import { formatTokens } from '@/lib/utils/token-counter';

interface CostEstimatorProps {
  selectedModels: string[];
  allModels: CatalogModel[];
  inputTokens: number;
}

export function CostEstimator({
  selectedModels,
  allModels,
  inputTokens,
}: CostEstimatorProps) {
  if (selectedModels.length === 0) return null;

  const findModel = (id: string): CatalogModel | undefined =>
    allModels.find((m) => m.id === id);

  return (
    <div className="bg-muted/30 px-3 py-2 border-b">
      <div className="flex items-center gap-1.5 mb-1.5">
        <TrendingUp className="w-3 h-3 text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground">
          Costo estimado (input)
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {selectedModels.map((modelId) => {
          const model = findModel(modelId);
          const cost = model
            ? (inputTokens / 1_000_000) * model.pricing.input
            : null;
          return (
            <div key={modelId} className="flex items-center gap-1 text-[10px]">
              <span className="text-muted-foreground">
                {model?.label ?? modelId}:
              </span>
              <span className="font-mono font-medium">
                {cost != null ? `$${cost.toFixed(5)}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/60">
        ~{formatTokens(inputTokens)} tokens de entrada
      </p>
    </div>
  );
}
