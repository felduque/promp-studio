'use client';

import { useState } from 'react';
import { usePromptStore } from '@/lib/stores/prompt-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

type ExportFormat = 'openai' | 'anthropic' | 'json' | 'yaml';

function generateOpenAIFormat(content: string, variables: { name: string; value: string; defaultValue: string }[], messages: { role: string; content: string }[], editorMode: string) {
  if (editorMode === 'chat' && messages.length > 0) {
    return JSON.stringify({
      model: 'gpt-4o',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 1024,
    }, null, 2);
  }

  let resolved = content;
  for (const v of variables) {
    const val = v.value || v.defaultValue || `<${v.name}>`;
    resolved = resolved.replaceAll(`{{${v.name}}}`, val);
  }

  return JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: resolved }],
    temperature: 0.7,
    max_tokens: 1024,
  }, null, 2);
}

function generateAnthropicFormat(content: string, variables: { name: string; value: string; defaultValue: string }[], messages: { role: string; content: string }[], editorMode: string) {
  if (editorMode === 'chat' && messages.length > 0) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const otherMsgs = messages.filter((m) => m.role !== 'system');
    return JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: otherMsgs.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      max_tokens: 1024,
      temperature: 0.7,
    }, null, 2);
  }

  let resolved = content;
  for (const v of variables) {
    const val = v.value || v.defaultValue || `<${v.name}>`;
    resolved = resolved.replaceAll(`{{${v.name}}}`, val);
  }

  return JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: resolved }],
    max_tokens: 1024,
    temperature: 0.7,
  }, null, 2);
}

function generateJSONFormat(content: string, variables: { name: string; type: string; defaultValue: string; value: string }[], messages: { role: string; content: string }[], editorMode: string) {
  return JSON.stringify({
    prompt: {
      mode: editorMode,
      template: content,
      variables: variables.map((v) => ({
        name: v.name,
        type: v.type,
        defaultValue: v.defaultValue,
        ...(v.value ? { testValue: v.value } : {}),
      })),
      ...(editorMode === 'chat' ? { messages } : {}),
    },
    settings: {
      temperature: 0.7,
      maxTokens: 1024,
    },
  }, null, 2);
}

function generateYAMLFormat(content: string, variables: { name: string; type: string; defaultValue: string; value: string }[], messages: { role: string; content: string }[], editorMode: string) {
  let yaml = `# Prompt Studio Export\n`;
  yaml += `mode: ${editorMode}\n\n`;

  if (editorMode === 'template') {
    yaml += `template: |\n`;
    content.split('\n').forEach((line) => {
      yaml += `  ${line}\n`;
    });
  }

  if (variables.length > 0) {
    yaml += `\nvariables:\n`;
    variables.forEach((v) => {
      yaml += `  - name: ${v.name}\n`;
      yaml += `    type: ${v.type}\n`;
      if (v.defaultValue) yaml += `    default: "${v.defaultValue}"\n`;
    });
  }

  if (editorMode === 'chat' && messages.length > 0) {
    yaml += `\nmessages:\n`;
    messages.forEach((m) => {
      yaml += `  - role: ${m.role}\n`;
      yaml += `    content: |\n`;
      m.content.split('\n').forEach((line) => {
        yaml += `      ${line}\n`;
      });
    });
  }

  yaml += `\nsettings:\n`;
  yaml += `  temperature: 0.7\n`;
  yaml += `  max_tokens: 1024\n`;

  return yaml;
}

const FORMAT_INFO: Record<ExportFormat, { label: string; description: string; lang: string; ext: string }> = {
  openai: { label: 'OpenAI API', description: 'Formato compatible con la API de OpenAI', lang: 'json', ext: 'json' },
  anthropic: { label: 'Anthropic API', description: 'Formato compatible con la API de Anthropic', lang: 'json', ext: 'json' },
  json: { label: 'JSON (Prompt Studio)', description: 'Formato completo con variables y configuración', lang: 'json', ext: 'json' },
  yaml: { label: 'YAML', description: 'Formato legible para documentación y CI/CD', lang: 'yaml', ext: 'yaml' },
};

export function PromptExport() {
  const { content, variables, messages, editorMode } = usePromptStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('openai');
  const [copied, setCopied] = useState(false);

  const getExportContent = (format: ExportFormat) => {
    switch (format) {
      case 'openai':
        return generateOpenAIFormat(content, variables, messages, editorMode);
      case 'anthropic':
        return generateAnthropicFormat(content, variables, messages, editorMode);
      case 'json':
        return generateJSONFormat(content, variables, messages, editorMode);
      case 'yaml':
        return generateYAMLFormat(content, variables, messages, editorMode);
    }
  };

  const handleExport = (format: ExportFormat) => {
    setSelectedFormat(format);
    setExportOpen(true);
  };

  const handleCopy = () => {
    const exported = getExportContent(selectedFormat);
    navigator.clipboard.writeText(exported);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const exported = getExportContent(selectedFormat);
    const info = FORMAT_INFO[selectedFormat];
    const blob = new Blob([exported], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-export.${info.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Descargado como prompt-export.${info.ext}`);
  };

  const exportedContent = getExportContent(selectedFormat);
  const info = FORMAT_INFO[selectedFormat];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-1 px-2 h-7 text-xs" />}>
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Exportar prompt</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.entries(FORMAT_INFO) as [ExportFormat, typeof FORMAT_INFO[ExportFormat]][]).map(
              ([key, info]) => (
                <DropdownMenuItem key={key} onClick={() => handleExport(key)}>
                  <div>
                    <div className="font-medium text-sm">{info.label}</div>
                    <div className="text-muted-foreground text-xs">{info.description}</div>
                  </div>
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Exportar — {info.label}
            </DialogTitle>
          </DialogHeader>

          {/* Format tabs */}
          <div className="flex gap-1 pb-2 border-b">
            {(Object.entries(FORMAT_INFO) as [ExportFormat, typeof FORMAT_INFO[ExportFormat]][]).map(
              ([key, fmt]) => (
                <button
                  key={key}
                  onClick={() => setSelectedFormat(key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedFormat === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {fmt.label}
                </button>
              )
            )}
          </div>

          {/* Code preview */}
          <div className="flex-1 min-h-0 overflow-auto bg-muted/30 border rounded-lg">
            <pre className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {exportedContent}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Descargar .{info.ext}
            </Button>
            <span className="ml-auto text-muted-foreground text-xs">
              {exportedContent.length} caracteres
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
