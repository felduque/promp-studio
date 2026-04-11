'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

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
    <div className="space-y-3 p-3 border-b">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs">Temperature</Label>
          <span className="text-muted-foreground text-xs">{temperature}</span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={(value) =>
            onTemperatureChange(Array.isArray(value) ? value[0] : value)
          }
          min={0}
          max={2}
          step={0.1}
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs">Max Tokens</Label>
          <span className="text-muted-foreground text-xs">{maxTokens}</span>
        </div>
        <Slider
          value={[maxTokens]}
          onValueChange={(value) =>
            onMaxTokensChange(Array.isArray(value) ? value[0] : value)
          }
          min={64}
          max={4096}
          step={64}
        />
      </div>
    </div>
  );
}
