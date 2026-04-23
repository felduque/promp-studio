'use client';

import { useState } from 'react';
import { usePromptStore } from '@/lib/stores/prompt-store';
import { insertTextAtCursor } from '@/lib/editor-ref';
import { Button } from '@/components/ui/button';
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
import { Braces, FileCode } from 'lucide-react';
import { PromptExport } from './prompt-export';

const PROMPT_TEMPLATES = [
  {
    name: 'Chain of Thought',
    icon: '🧠',
    content: `You are a helpful assistant. Let's think step by step.\n\nProblem: {{problem}}\n\n1. First, analyze the core question.\n2. Break it into sub-problems.\n3. Solve each sub-problem.\n4. Synthesize the final answer.`,
  },
  {
    name: 'Few-Shot',
    icon: '📝',
    content: `Given the following examples, process the new input accordingly.\n\nExample 1:\nInput: {{example1_input}}\nOutput: {{example1_output}}\n\nNow process:\nInput: {{input}}\nOutput:`,
  },
  {
    name: 'Role Play',
    icon: '🎭',
    content: `You are {{role}}, an expert in {{domain}}.\n\nYour task is to {{task}}.\n\nGuidelines:\n- {{guideline1}}\n- {{guideline2}}\n\nContext: {{context}}`,
  },
  {
    name: 'Extractor',
    icon: '🔍',
    content: `Extract the following information from the text below:\n\nFields to extract:\n{{fields}}\n\nText:\n"""\n{{text}}\n"""\n\nReturn the result as a JSON object.`,
  },
  {
    name: 'Traductor',
    icon: '🌐',
    content: `// Role Definition\nYou are a professional translator with expertise in {{source_language}} and {{target_language}}.\n\n// Context\nTranslate the following text while preserving:\n- Original tone and register ({{tone}})\n- Technical terminology and domain-specific jargon\n- Formatting, line breaks, and structure\n- Cultural nuances and idiomatic expressions\n\n// Glossary (optional)\nUse these preferred translations for key terms:\n{{glossary}}\n\n// Source Text\n"""\n{{source_text}}\n"""\n\n// Instructions\n1. Analyze the source text for context, tone, and domain.\n2. Translate naturally — avoid literal word-by-word translation.\n3. Adapt idioms and cultural references for the target audience.\n4. If a term has no direct equivalent, provide the closest match with a translator's note in [brackets].\n5. Return ONLY the translated text, no explanations.`,
  },
  {
    name: 'Evaluador',
    icon: '⚖️',
    content: `Evaluate the following {{item_type}} based on these criteria:\n\nCriteria:\n1. {{criteria1}} (weight: {{weight1}})\n2. {{criteria2}} (weight: {{weight2}})\n3. {{criteria3}} (weight: {{weight3}})\n\nItem to evaluate:\n"""\n{{item}}\n"""\n\nProvide a score (1-10) for each criterion and an overall assessment.`,
  },
];

export function EditorToolbar() {
  const { variables, editorMode, setEditorMode } = usePromptStore();
  const [varName, setVarName] = useState('');
  const [varPopoverOpen, setVarPopoverOpen] = useState(false);

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
    <div className="flex items-center justify-between bg-[#131b2e] border-b border-[#2d3449]/30 px-4 py-3">
      {/* Left: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Variables */}
        <Popover open={varPopoverOpen} onOpenChange={setVarPopoverOpen}>
          <PopoverTrigger render={<button className="flex items-center gap-2 px-3 py-1.5 text-[#c0c1ff] text-sm hover:bg-[#2d3449]/50 rounded transition-colors" />}>
            <Braces className="w-3.5 h-3.5" />
            Variables
          </PopoverTrigger>
          <PopoverContent align="start" className="p-3 w-64 bg-[#131b2e] border-[rgba(70,69,84,0.15)]">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-medium text-xs text-[#c7c4d7]">Nueva variable</label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="nombre_variable"
                    value={varName}
                    onChange={(e) => setVarName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInsertVariable()}
                    className="h-7 text-xs bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd]"
                  />
                  <Button size="sm" variant="gradient" className="px-2 h-7 text-xs" onClick={handleInsertVariable}>
                    Insertar
                  </Button>
                </div>
              </div>
              {variables.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-medium text-[#464554] text-xs">Existentes</label>
                  <div className="flex flex-wrap gap-1">
                    {variables.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => handleInsertExistingVar(v.name)}
                        className="inline-flex items-center bg-[#39485a] px-1.5 py-0.5 rounded font-[var(--font-geist-mono)] text-[#a7b6cc] text-xs hover:bg-[#39485a]/80 transition-colors"
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
          <DropdownMenuTrigger render={<button className="flex items-center gap-2 px-3 py-1.5 text-[#c0c1ff] text-sm hover:bg-[#2d3449]/50 rounded transition-colors" />}>
            <FileCode className="w-3.5 h-3.5" />
            Templates
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-[#131b2e] border-[rgba(70,69,84,0.15)]">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[#464554]">Plantillas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROMPT_TEMPLATES.map((t) => (
                <DropdownMenuItem key={t.name} onClick={() => handleInsertTemplate(t.content)} className="text-[#c7c4d7] hover:text-[#dae2fd]">
                  <span className="mr-2">{t.icon}</span>
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <PromptExport />
      </div>

      {/* Right: Mode Toggle — matches Stitch's segmented control */}
      <div className="bg-[#2d3449] p-1 rounded-lg flex items-center backdrop-blur-md shadow-inner shadow-black/20">
        <button
          onClick={() => setEditorMode('template')}
          className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            editorMode === 'template'
              ? 'bg-[#131b2e] text-[#dae2fd] shadow-sm'
              : 'text-[#c7c4d7] hover:text-[#dae2fd]'
          }`}
        >
          Template
        </button>
        <button
          onClick={() => setEditorMode('chat')}
          className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            editorMode === 'chat'
              ? 'bg-[#131b2e] text-[#dae2fd] shadow-sm'
              : 'text-[#c7c4d7] hover:text-[#dae2fd]'
          }`}
        >
          Chat
        </button>
      </div>
    </div>
  );
}
