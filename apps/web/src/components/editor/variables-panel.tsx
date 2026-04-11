'use client';

import { usePromptStore } from '@/lib/stores/prompt-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Variable } from 'lucide-react';

export function VariablesPanel() {
  const { variables, setVariableValue, setVariables } = usePromptStore();

  if (variables.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12 text-center">
        <Variable className="w-8 h-8 text-muted-foreground/40" />
        <p className="mt-3 text-muted-foreground text-sm">
          Sin variables detectadas
        </p>
        <p className="mt-1 text-muted-foreground/70 text-xs">
          Usa {'{{nombre}}'} en tu prompt para crear variables
        </p>
      </div>
    );
  }

  const handleTypeChange = (name: string, type: string) => {
    const updated = variables.map((v) =>
      v.name === name ? { ...v, type: type as any } : v,
    );
    setVariables(updated);
  };

  const handleDefaultChange = (name: string, defaultValue: string) => {
    const updated = variables.map((v) =>
      v.name === name ? { ...v, defaultValue } : v,
    );
    setVariables(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-medium text-sm">
        <Variable className="w-4 h-4" />
        Variables
        <Badge variant="secondary" className="ml-auto">
          {variables.length}
        </Badge>
      </div>

      <div className="space-y-4">
        {variables.map((variable) => (
          <div
            key={variable.name}
            className="space-y-2 p-3 border rounded-lg"
          >
            <div className="flex justify-between items-center">
              <Label className="font-mono text-primary text-xs">
                {`{{${variable.name}}}`}
              </Label>
              <Select
                value={variable.type}
                onValueChange={(val) => val && handleTypeChange(variable.name, val)}
              >
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="enum">Enum</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Valor por defecto"
              value={variable.defaultValue ?? ''}
              onChange={(e) =>
                handleDefaultChange(variable.name, e.target.value)
              }
              className="h-8 text-xs"
            />

            <Input
              placeholder="Valor de prueba"
              value={variable.value ?? ''}
              onChange={(e) => setVariableValue(variable.name, e.target.value)}
              className="border-primary/30 focus-visible:ring-primary/30 h-8 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
