'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePromptStore, type PromptMessage } from '@/lib/stores/prompt-store';
import type { ChatTemplateData, PromptTemplateData } from '@/lib/types/studio';
import { insertTextAtCursor } from '@/lib/editor-ref';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Braces, FileCode, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PromptExport } from './prompt-export';

interface EditorToolbarProps {
  promptId: string;
  projectId: string;
  onImported?: (promptId?: string | null) => void;
}

export function EditorToolbar({ promptId, projectId, onImported }: EditorToolbarProps) {
  const {
    variables,
    editorMode,
    setEditorMode,
    content,
    messages,
    promptVariables,
    chatVariables,
    setContent,
    setVariables,
    setMessages,
  } = usePromptStore();
  const [varName, setVarName] = useState('');
  const [varPopoverOpen, setVarPopoverOpen] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplateData[]>([]);
  const [chatTemplates, setChatTemplates] = useState<ChatTemplateData[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const serializeVariables = (items: typeof promptVariables) =>
    items.map((item) => ({
      name: item.name,
      type: item.type,
      defaultValue: item.defaultValue,
      options: item.options,
    }));

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
        'string'
    ) {
      return (error as { response: { data: { message: string } } }).response.data.message;
    }
    return fallback;
  };

  const fetchTemplates = useCallback(async () => {
    try {
      const [promptResponse, chatResponse] = await Promise.all([
        apiClient.get<PromptTemplateData[]>('/templates/prompt'),
        apiClient.get<ChatTemplateData[]>('/templates/chat'),
      ]);
      setPromptTemplates(promptResponse.data);
      setChatTemplates(chatResponse.data);
    } catch {
      toast.error('No se pudieron cargar los templates');
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const activeTemplates = useMemo(
    () => (editorMode === 'chat' ? chatTemplates : promptTemplates),
    [chatTemplates, editorMode, promptTemplates],
  );

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

  const toChatMessages = (template: ChatTemplateData): PromptMessage[] => {
    if (template.messages.length > 0) return template.messages;

    return [
      { role: 'system', content: template.systemMessage || '' },
      { role: 'user', content: template.userMessage || '' },
      { role: 'assistant', content: template.assistantMessage || '' },
    ].filter((message) => message.content.trim().length > 0) as PromptMessage[];
  };

  const handleApplyTemplate = (template: PromptTemplateData | ChatTemplateData) => {
    if (template.type === 'prompt') {
      setEditorMode('template');
      setContent(template.content);
      setVariables(template.variables || []);
      toast.success(`Template aplicado: ${template.name}`);
      return;
    }

    setEditorMode('chat');
    setMessages(toChatMessages(template));
    setVariables(template.variables || []);
    toast.success(`Template de chat aplicado: ${template.name}`);
  };

  const handleSaveTemplate = async () => {
    const name = window.prompt(
      editorMode === 'chat' ? 'Nombre del template de chat' : 'Nombre del template de prompt',
    );
    if (!name?.trim()) return;

    setSavingTemplate(true);
    try {
      if (editorMode === 'chat') {
        const systemMessage =
          messages.find((message) => message.role === 'system')?.content || null;
        const userMessage = messages.find((message) => message.role === 'user')?.content || null;
        const assistantMessage =
          messages.find((message) => message.role === 'assistant')?.content || null;
        await apiClient.post('/templates/chat', {
          name: name.trim(),
          systemMessage,
          userMessage,
          assistantMessage,
          messages,
          variables: serializeVariables(chatVariables),
        });
      } else {
        await apiClient.post('/templates/prompt', {
          name: name.trim(),
          content,
          variables: serializeVariables(promptVariables),
          messages: [],
        });
      }
      await fetchTemplates();
      toast.success('Template guardado');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'No se pudo guardar el template'));
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-[#131b2e] border-b border-[#2d3449]/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <Popover open={varPopoverOpen} onOpenChange={setVarPopoverOpen}>
          <PopoverTrigger
            render={
              <button className="flex items-center gap-2 px-3 py-1.5 text-[#c0c1ff] text-sm hover:bg-[#2d3449]/50 rounded transition-colors" />
            }
          >
            <Braces className="w-3.5 h-3.5" />
            Variables
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="p-3 w-64 bg-[#131b2e] border-[rgba(70,69,84,0.15)]"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-medium text-xs text-[#c7c4d7]">Nueva variable</label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="nombre_variable"
                    value={varName}
                    onChange={(event) => setVarName(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleInsertVariable()}
                    className="h-7 text-xs bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd]"
                  />
                  <Button
                    size="sm"
                    variant="gradient"
                    className="px-2 h-7 text-xs"
                    onClick={handleInsertVariable}
                  >
                    Insertar
                  </Button>
                </div>
              </div>
              {variables.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-medium text-[#464554] text-xs">Existentes</label>
                  <div className="flex flex-wrap gap-1">
                    {variables.map((variable) => (
                      <button
                        key={variable.name}
                        onClick={() => handleInsertExistingVar(variable.name)}
                        className="inline-flex items-center bg-[#39485a] px-1.5 py-0.5 rounded font-[var(--font-geist-mono)] text-[#a7b6cc] text-xs hover:bg-[#39485a]/80 transition-colors"
                      >
                        {`{{${variable.name}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 px-3 py-1.5 text-[#c0c1ff] text-sm hover:bg-[#2d3449]/50 rounded transition-colors" />
            }
          >
            <FileCode className="w-3.5 h-3.5" />
            Templates
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 bg-[#131b2e] border-[rgba(70,69,84,0.15)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[#464554]">
                {editorMode === 'chat' ? 'Templates de chat' : 'Templates de prompt'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeTemplates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className="text-[#c7c4d7] hover:text-[#dae2fd]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{template.name}</span>
                      <span className="text-[10px] uppercase text-[#8083ff]">
                        {template.isSystem ? 'Sistema' : 'Propio'}
                      </span>
                    </div>
                    {template.description && (
                      <div className="text-xs text-[#464554] truncate">{template.description}</div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              {activeTemplates.length === 0 && (
                <DropdownMenuItem disabled>No hay templates disponibles</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSaveTemplate} disabled={savingTemplate}>
                <Save className="w-3.5 h-3.5 mr-2" />
                Guardar actual como template
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <PromptExport promptId={promptId} projectId={projectId} onImported={onImported} />
      </div>

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
