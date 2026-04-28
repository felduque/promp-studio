'use client';

import { usePromptStore } from '@/lib/stores/prompt-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

export function PromptPreview() {
  const { resolveTemplate, variables, editorMode, messages } = usePromptStore();
  const resolved = resolveTemplate();
  const chatPreview = messages.filter((message) => message.content.trim().length > 0);

  const hasUnresolved = resolved.includes('{{');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Preview</span>
        {hasUnresolved && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Variables sin resolver
          </Badge>
        )}
      </div>
      <ScrollArea className="flex-1 p-4">
        {editorMode === 'chat' && chatPreview.length > 0 ? (
          <div className="space-y-3">
            {chatPreview.map((message, index) => (
              <div key={`${message.role}-${index}`} className="rounded border bg-muted/20 p-3">
                <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {message.role}
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {message.content}
                </pre>
              </div>
            ))}
          </div>
        ) : resolved ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{resolved}</pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Escribe algo en el editor para ver el preview...
          </p>
        )}
      </ScrollArea>
      {variables.length > 0 && (
        <div className="border-t px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {variables.map((v) => (
              <Badge
                key={v.name}
                variant={v.value || v.defaultValue ? 'default' : 'outline'}
                className="text-xs"
              >
                {v.name}: {v.value || v.defaultValue || '—'}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
