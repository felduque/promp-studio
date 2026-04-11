'use client';

import { useState } from 'react';
import { usePromptStore } from '@/lib/stores/prompt-store';
import { insertTextAtCursor } from '@/lib/editor-ref';
import { estimateTokens, formatTokens } from '@/lib/utils/token-counter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Variable,
  FileCode,
  MessageSquare,
  FileText,
  Hash,
  Keyboard,
  Braces,
} from 'lucide-react';

const PROMPT_TEMPLATES = [
  {
    name: 'Chain of Thought',
    icon: '🧠',
    content: `You are a helpful assistant. Let's think step by step.

Problem: {{problem}}

1. First, analyze the core question.
2. Break it into sub-problems.
3. Solve each sub-problem.
4. Synthesize the final answer.`,
  },
  {
    name: 'Few-Shot',
    icon: '📝',
    content: `Given the following examples, process the new input accordingly.

Example 1:
Input: {{example1_input}}
Output: {{example1_output}}

Example 2:
Input: {{example2_input}}
Output: {{example2_output}}

Now process:
Input: {{input}}
Output:`,
  },
  {
    name: 'Role Play',
    icon: '🎭',
    content: `You are {{role}}, an expert in {{domain}}.

Your task is to {{task}}.

Guidelines:
- {{guideline1}}
- {{guideline2}}

Context: {{context}}

Please respond in a {{tone}} tone.`,
  },
  {
    name: 'Extractor',
    icon: '🔍',
    content: `Extract the following information from the text below:

Fields to extract:
{{fields}}

Text:
"""
{{text}}
"""

Return the result as a JSON object.`,
  },
  {
    name: 'Evaluador',
    icon: '⚖️',
    content: `Evaluate the following {{item_type}} based on these criteria:

Criteria:
1. {{criteria1}} (weight: {{weight1}})
2. {{criteria2}} (weight: {{weight2}})
3. {{criteria3}} (weight: {{weight3}})

Item to evaluate:
"""
{{item}}
"""

Provide a score (1-10) for each criterion and an overall assessment.`,
  },
  {
    name: 'Traductor',
    icon: '🌐',
    content: `Translate the following text from {{source_language}} to {{target_language}}.

Maintain the original:
- Tone and style
- Technical terminology
- Formatting

Text:
"""
{{text}}
"""`,
  },
];

const VARIABLE_TYPES = [
  { type: 'string', icon: <Variable className="w-3.5 h-3.5" />, label: 'Texto', template: '{{name}}' },
  { type: 'number', icon: <Hash className="w-3.5 h-3.5" />, label: 'Numero', template: '{{count}}' },
  { type: 'json', icon: <Braces className="w-3.5 h-3.5" />, label: 'JSON', template: '{{data}}' },
];

export function EditorToolbar() {
  const { content, variables, editorMode, setEditorMode } = usePromptStore();
  const [varName, setVarName] = useState('');
  const [varPopoverOpen, setVarPopoverOpen] = useState(false);

  const tokens = estimateTokens(content);
  const words = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const chars = content?.length || 0;

  const handleInsertVariable = () => {
    const name = varName.trim();
    if (!name) return;
    insertTextAtCursor(`{{${name}}}`);
    setVarName('');
    setVarPopoverOpen(false);
  };

  const handleInsertExistingVar = (name: string) => {
    insertTextAtCursor(`{{${name}}}`);
  };

  const handleInsertTemplate = (template: string) => {
    insertTextAtCursor(template);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 bg-muted/30 px-2 py-1.5 border-b">
      {/* Insert Variable */}
      <Popover open={varPopoverOpen} onOpenChange={setVarPopoverOpen}>
        <PopoverTrigger render={<Button variant="ghost" size="sm" className="gap-1 px-2 h-7 text-xs" />}>
          <Variable className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Variable</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-3 w-64">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-medium text-xs">Nueva variable</label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="nombre_variable"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsertVariable()}
                  className="h-7 text-xs"
                />
                <Button size="sm" className="px-2 h-7 text-xs" onClick={handleInsertVariable}>
                  Insertar
                </Button>
              </div>
            </div>
            {variables.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground text-xs">Variables existentes</label>
                <div className="flex flex-wrap gap-1">
                  {variables.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => handleInsertExistingVar(v.name)}
                      className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md font-mono text-primary text-xs transition-colors"
                    >
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Templates */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-1 px-2 h-7 text-xs" />}>
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Templates</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Plantillas de prompt</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PROMPT_TEMPLATES.map((t) => (
              <DropdownMenuItem key={t.name} onClick={() => handleInsertTemplate(t.content)}>
                <span className="mr-2">{t.icon}</span>
                {t.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Mode Toggle */}
      <div className="flex items-center bg-background p-0.5 border rounded-md">
        <button
          onClick={() => setEditorMode('template')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
            editorMode === 'template'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Template</span>
        </button>
        <button
          onClick={() => setEditorMode('chat')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
            editorMode === 'chat'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="hidden sm:inline" title="Tokens estimados">
          ~{formatTokens(tokens)} tokens
        </span>
        <span className="hidden md:inline">{words} palabras</span>
        <span className="hidden lg:inline">{chars} chars</span>
        <Badge variant="outline" className="px-1.5 py-0 h-5 text-[10px]">
          ~{formatTokens(tokens)} tok
        </Badge>
      </div>

      {/* Shortcuts hint */}
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" size="sm" className="p-0 w-7 h-7" />}>
          <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="end" className="p-3 w-52">
          <div className="space-y-2">
            <p className="font-medium text-xs">Atajos de teclado</p>
            <div className="space-y-1.5 text-muted-foreground text-xs">
              <div className="flex justify-between">
                <span>Guardar version</span>
                <kbd className="bg-muted px-1.5 py-0.5 border rounded font-mono text-[10px]">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Ejecutar prompt</span>
                <kbd className="bg-muted px-1.5 py-0.5 border rounded font-mono text-[10px]">Ctrl+Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Insertar variable</span>
                <kbd className="bg-muted px-1.5 py-0.5 border rounded font-mono text-[10px]">Ctrl+I</kbd>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
