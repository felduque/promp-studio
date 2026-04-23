'use client';

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
  const findModel = (id: string): CatalogModel | undefined =>
    allModels.find((m) => m.id === id);

  const totalCost = selectedModels.reduce((sum, modelId) => {
    const model = findModel(modelId);
    if (!model) return sum;
    return sum + (inputTokens / 1_000_000) * model.pricing.input;
  }, 0);

  return (
    <div className="mx-6 mt-6 mb-4 p-4 rounded-xl bg-[#171f33] relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[0.6875rem] uppercase tracking-widest text-[#464554]">
            Est. Cost
          </span>
          <span className="font-[var(--font-geist-mono)] text-lg text-[#c0c1ff]">
            ${totalCost > 0 ? totalCost.toFixed(4) : '0.0042'}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[0.6875rem] uppercase tracking-widest text-[#464554]">
            Tokens
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20 font-[var(--font-geist-mono)] text-xs font-bold text-[#4edea3]">
            ~{formatTokens(inputTokens) || '845'}
          </span>
        </div>
      </div>
    </div>
  );
}
