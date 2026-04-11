'use client';

import { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitCompareArrows } from 'lucide-react';

interface Version {
  id: string;
  versionNumber: number;
  content: string;
  commitMessage: string;
  createdAt: string;
}

interface VersionDiffProps {
  versions: Version[];
}

export function VersionDiff({ versions }: VersionDiffProps) {
  const { resolvedTheme } = useTheme();
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const [leftId, setLeftId] = useState<string>(sorted[1]?.id ?? sorted[0]?.id ?? '');
  const [rightId, setRightId] = useState<string>(sorted[0]?.id ?? '');

  const leftVersion = sorted.find((v) => v.id === leftId);
  const rightVersion = sorted.find((v) => v.id === rightId);

  if (sorted.length < 2) {
    return (
      <div className="flex flex-col justify-center items-center py-12 text-center">
        <GitCompareArrows className="w-8 h-8 text-muted-foreground/40" />
        <p className="mt-3 text-muted-foreground text-sm">
          Necesitas al menos 2 versiones para comparar
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Selectors */}
      <div className="space-y-2 px-3 py-2 border-b">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="justify-center bg-red-500/10 border-red-500/20 w-10 text-[10px] text-red-600 shrink-0">
            Old
          </Badge>
          <Select value={leftId} onValueChange={(val) => val && setLeftId(val)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  v{v.versionNumber} — {v.commitMessage || 'Sin mensaje'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="justify-center bg-green-500/10 border-green-500/20 w-10 text-[10px] text-green-600 shrink-0">
            New
          </Badge>
          <Select value={rightId} onValueChange={(val) => val && setRightId(val)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  v{v.versionNumber} — {v.commitMessage || 'Sin mensaje'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Diff Editor — inline mode for narrow panel */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          height="100%"
          original={leftVersion?.content ?? ''}
          modified={rightVersion?.content ?? ''}
          language="plaintext"
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            readOnly: true,
            renderSideBySide: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 12,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            folding: false,
            glyphMargin: true,
            renderIndicators: true,
            renderMarginRevertIcon: false,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
