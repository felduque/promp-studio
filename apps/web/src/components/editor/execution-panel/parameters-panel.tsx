'use client';

import { Slider } from '@/components/ui/slider';
import { Thermometer, Hash } from 'lucide-react';

interface ParametersPanelProps {
  temperature: number;
  onTemperatureChange: (value: number) => void;
  maxTokens: number;
  onMaxTokensChange: (value: number) => void;
}

export function ParametersPanel({
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
}: ParametersPanelProps) {
  return (
    <div className="space-y-6">
      {/* Temperature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">
            <Thermometer className="w-3.5 h-3.5" />
            Temperature
          </span>
          <span className="font-[var(--font-geist-mono)] text-xs font-bold text-[#c0c1ff] bg-[#171f33] px-2 py-1 rounded">
            {temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={(value) =>
            onTemperatureChange(Array.isArray(value) ? value[0] : value)
          }
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Max Tokens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">
            <Hash className="w-3.5 h-3.5" />
            Max Tokens
          </span>
          <span className="font-[var(--font-geist-mono)] text-xs text-[#dae2fd] bg-[#171f33] px-2 py-1 rounded">
            {maxTokens}
          </span>
        </div>
        <Slider
          value={[maxTokens]}
          onValueChange={(value) =>
            onMaxTokensChange(Array.isArray(value) ? value[0] : value)
          }
          min={64}
          max={4096}
          step={64}
          className="w-full"
        />
      </div>
    </div>
  );
}
