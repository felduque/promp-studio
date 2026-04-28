'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePromptStore } from '@/lib/stores/prompt-store';
import type { ChatVersionData, PromptData, PromptVersionData } from '@/lib/types/studio';
import { PromptEditor } from '@/components/editor/prompt-editor';
import { VariablesPanel } from '@/components/editor/variables-panel';
import { PromptPreview } from '@/components/editor/prompt-preview';
import { ExecutionPanel } from '@/components/editor/execution-panel';
import { VersionDiff } from '@/components/editor/version-diff';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

const TABS = [
  { id: 'variables', label: 'VARIABLES' },
  { id: 'preview', label: 'PREVIEW' },
  { id: 'history', label: 'HISTORIAL' },
  { id: 'diff', label: 'DIFF' },
  { id: 'execute', label: 'EJECUTAR' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function PromptEditorPage() {
  const params = useParams();
  const router = useRouter();
  const promptId = params.promptId as string;
  const projectId = params.projectId as string;

  const {
    content,
    promptVariables,
    chatVariables,
    messages,
    isDirty,
    promptDirty,
    chatDirty,
    editorMode,
    hydratePrompt,
    hydrateChat,
    resetDirty,
  } = usePromptStore();

  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [saveScope, setSaveScope] = useState<'prompt' | 'chat' | 'all' | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('execute');
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchPrompt = useCallback(async () => {
    try {
      const { data } = await apiClient.get<PromptData>(`/prompts/${promptId}`);
      setPrompt(data);

      if (data.versions && data.versions.length > 0) {
        const latest = data.versions.sort(
          (a: PromptVersionData, b: PromptVersionData) => b.versionNumber - a.versionNumber,
        )[0];
        hydratePrompt(latest.content || '', latest.variables || []);
      } else {
        hydratePrompt('', []);
      }

      if (data.chatVersions && data.chatVersions.length > 0) {
        const latestChat = data.chatVersions.sort(
          (a: ChatVersionData, b: ChatVersionData) => b.versionNumber - a.versionNumber,
        )[0];
        hydrateChat(latestChat.messages || [], latestChat.variables || []);
      } else {
        hydrateChat([], []);
      }
      resetDirty('all');
    } catch {
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  }, [promptId, projectId, router, hydratePrompt, hydrateChat, resetDirty]);

  useEffect(() => {
    setLoading(true);
    hydratePrompt('', []);
    hydrateChat([], []);
  }, [promptId, hydratePrompt, hydrateChat]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  const openSaveDialog = useCallback(
    (scope?: 'prompt' | 'chat' | 'all') => {
      if (!isDirty) return;
      if (scope) {
        setSaveScope(scope);
      } else if (promptDirty && chatDirty) {
        setSaveScope(null);
      } else {
        setSaveScope(promptDirty ? 'prompt' : 'chat');
      }
      setCommitDialogOpen(true);
    },
    [chatDirty, isDirty, promptDirty],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        openSaveDialog();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setActiveTab('execute');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSaveDialog]);

  const withoutRuntimeValues = (items: typeof promptVariables) =>
    items.map((item) => ({
      name: item.name,
      type: item.type,
      defaultValue: item.defaultValue,
      options: item.options,
    }));

  const handleSave = async (scopeOverride?: 'prompt' | 'chat' | 'all') => {
    const scope = scopeOverride || saveScope;
    if (!scope) return;
    setSaving(true);
    try {
      if (scope === 'prompt' || scope === 'all') {
        await apiClient.post(`/prompts/${promptId}/versions`, {
          content,
          variables: withoutRuntimeValues(promptVariables),
          messages: [],
          commitMessage: commitMessage.trim() || undefined,
          parentVersionId: prompt?.currentVersionId || undefined,
        });
        resetDirty('prompt');
      }

      if (scope === 'chat' || scope === 'all') {
        await apiClient.post(`/prompts/${promptId}/chat-versions`, {
          systemMessage:
            messages.find((message) => message.role === 'system')?.content || undefined,
          userMessage: messages.find((message) => message.role === 'user')?.content || undefined,
          assistantMessage:
            messages.find((message) => message.role === 'assistant')?.content || undefined,
          messages,
          variables: withoutRuntimeValues(chatVariables),
          commitMessage: commitMessage.trim() || undefined,
          parentVersionId: prompt?.currentChatVersionId || undefined,
        });
        resetDirty('chat');
      }

      toast.success('Cambios guardados');
      setCommitMessage('');
      setSaveScope(null);
      setCommitDialogOpen(false);
      fetchPrompt();
    } catch (err) {
      console.error('Error saving version:', err);
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-ps-bg-base">
        <div className="border-4 border-ps-accent border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!prompt) return null;

  const currentVersion = prompt.versions?.sort((a, b) => b.versionNumber - a.versionNumber)[0];
  const currentChatVersion = prompt.chatVersions?.sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
  const activeDirty = editorMode === 'chat' ? chatDirty : promptDirty;
  const activeHistory =
    editorMode === 'chat' ? (prompt.chatVersions ?? []) : (prompt.versions ?? []);
  const diffVersions =
    editorMode === 'chat'
      ? (prompt.chatVersions ?? []).map((version) => ({
          id: version.id,
          versionNumber: version.versionNumber,
          content: JSON.stringify(
            {
              systemMessage: version.systemMessage,
              userMessage: version.userMessage,
              assistantMessage: version.assistantMessage,
              messages: version.messages,
              parameters: version.parameters,
            },
            null,
            2,
          ),
          commitMessage: version.commitMessage || '',
          createdAt: version.createdAt,
        }))
      : (prompt.versions ?? []);

  return (
    <div className="flex flex-col h-full bg-ps-bg-base">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-[#060e20] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
            {prompt.name}
          </h1>
          {(editorMode === 'chat' ? currentChatVersion : currentVersion) && (
            <span className="bg-[#39485a] text-[#a7b6cc] px-2 py-0.5 rounded text-xs font-bold font-[var(--font-geist-mono)] uppercase tracking-wider">
              {editorMode === 'chat' ? 'CHAT' : 'PROMPT'} V
              {(editorMode === 'chat' ? currentChatVersion : currentVersion)?.versionNumber}
            </span>
          )}
          <span className="font-[var(--font-geist-mono)] text-sm text-[#464554] ml-2">
            {(editorMode === 'chat' ? currentChatVersion : currentVersion)
              ? `Edited ${getTimeAgo((editorMode === 'chat' ? currentChatVersion : currentVersion)!.createdAt)}`
              : 'New prompt'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isDirty && (
            <button
              className="text-[#c0c1ff] hover:bg-[#2d3449]/30 px-4 py-2 rounded text-sm transition-colors"
              onClick={() => {
                if (currentVersion) {
                  hydratePrompt(currentVersion.content || '', currentVersion.variables || []);
                } else {
                  hydratePrompt('', []);
                }
                const currentChatVersion = prompt.chatVersions?.sort(
                  (a, b) => b.versionNumber - a.versionNumber,
                )[0];
                hydrateChat(
                  currentChatVersion?.messages || [],
                  currentChatVersion?.variables || [],
                );
                resetDirty('all');
              }}
            >
              Discard Changes
            </button>
          )}
          <button
            className="bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-bold rounded px-6 py-2 shadow-[0_4px_14px_rgba(192,193,255,0.2)] hover:shadow-[0_6px_20px_rgba(192,193,255,0.3)] transition-all flex items-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => openSaveDialog()}
            disabled={!isDirty}
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40" />
            <Save className="w-4 h-4" />
            Save Version
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden gap-6 p-6">
        {/* Editor Area — flex-[6.5] like Stitch */}
        <div className="flex-[6.5] min-w-0 min-h-0">
          <PromptEditor
            promptId={prompt.id}
            projectId={projectId}
            onImported={(importedPromptId) => {
              if (importedPromptId) {
                router.push(`/projects/${projectId}/prompts/${importedPromptId}`);
              } else {
                fetchPrompt();
              }
            }}
          />
        </div>

        {/* Right Panel — flex-[3.5] like Stitch */}
        <section className="flex-[3.5] flex flex-col bg-[#131b2e] rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.15)] relative">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(192,193,255,0.05)] to-transparent pointer-events-none" />

          {/* Tabs */}
          <div className="flex bg-[#2d3449]/80 backdrop-blur-xl overflow-x-auto border-b border-[#2d3449]/50 relative z-10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !isExecuting && setActiveTab(tab.id)}
                disabled={isExecuting && tab.id !== 'execute'}
                className={`px-5 py-4 text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#c0c1ff] border-b-2 border-[#c0c1ff] bg-[#2d3449]/50 font-bold'
                    : isExecuting && tab.id !== 'execute'
                      ? 'text-[#464554] cursor-not-allowed'
                      : 'text-[#c7c4d7] hover:text-[#dae2fd]'
                }`}
              >
                {tab.id === 'execute' && isExecuting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {tab.label}
                  </span>
                ) : (
                  tab.label
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative z-10">
            {activeTab === 'variables' && (
              <ScrollArea className="h-full p-6">
                <VariablesPanel />
              </ScrollArea>
            )}
            {activeTab === 'preview' && <PromptPreview />}
            {activeTab === 'history' && (
              <ScrollArea className="h-full p-6">
                <div className="space-y-3">
                  {[...activeHistory]
                    .sort((a, b) => b.versionNumber - a.versionNumber)
                    .map((version) => (
                      <button
                        key={version.id}
                        className="w-full text-left p-4 rounded-xl bg-[#171f33] hover:bg-[#2d3449]/30 border border-[rgba(70,69,84,0.15)] transition-all"
                        onClick={() => {
                          if (editorMode === 'chat') {
                            const chatVersion = version as ChatVersionData;
                            hydrateChat(chatVersion.messages || [], chatVersion.variables || []);
                          } else {
                            const promptVersion = version as PromptVersionData;
                            hydratePrompt(
                              promptVersion.content || '',
                              promptVersion.variables || [],
                            );
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-[var(--font-geist-mono)] text-xs text-[#c0c1ff] bg-[#060e20] px-2 py-0.5 rounded">
                            v{version.versionNumber}
                          </span>
                          {version.tag && (
                            <span className="text-xs text-[#8083ff] bg-[#c0c1ff]/20 px-2 py-0.5 rounded">
                              {version.tag}
                            </span>
                          )}
                        </div>
                        {version.commitMessage && (
                          <p className="mt-2 text-sm text-[#dae2fd]">{version.commitMessage}</p>
                        )}
                        <p className="mt-1 text-xs text-[#464554]">
                          {new Date(version.createdAt).toLocaleString('es')}
                          {version.author && ` · ${version.author.name}`}
                        </p>
                      </button>
                    ))}
                  {activeHistory.length === 0 && (
                    <p className="py-8 text-[#c7c4d7] text-sm text-center">
                      Sin versiones aún. Guarda tu primera versión.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
            {activeTab === 'diff' && <VersionDiff versions={diffVersions} />}
            {/* ExecutionPanel always mounted to preserve state during execution */}
            <div className={activeTab === 'execute' ? 'h-full' : 'hidden'}>
              <ExecutionPanel
                promptId={prompt.id}
                promptVersionId={editorMode === 'chat' ? null : prompt.currentVersionId}
                chatVersionId={editorMode === 'chat' ? prompt.currentChatVersionId : null}
                defaultModel={prompt.defaultModel}
                isDirty={activeDirty}
                editorMode={editorMode}
                currentContent={content}
                currentMessages={messages}
                onSaveAndExecute={() => openSaveDialog(editorMode === 'chat' ? 'chat' : 'prompt')}
                onExecutingChange={setIsExecuting}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Save dialog */}
      <Dialog
        open={commitDialogOpen}
        onOpenChange={(open) => {
          setCommitDialogOpen(open);
          if (!open) setSaveScope(null);
        }}
      >
        <DialogContent className="bg-[#131b2e] border-[rgba(70,69,84,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#dae2fd]">Guardar cambios</DialogTitle>
            <DialogDescription className="text-[#c7c4d7]">
              El mensaje de commit es opcional. Elige que area guardar cuando hay cambios en ambas
              vistas.
            </DialogDescription>
          </DialogHeader>
          {promptDirty && chatDirty && !saveScope && (
            <div className="grid grid-cols-3 gap-2">
              <button
                className="bg-[#171f33] hover:bg-[#2d3449]/50 text-[#dae2fd] rounded px-3 py-2 text-sm"
                onClick={() => setSaveScope('all')}
              >
                Guardar todo
              </button>
              <button
                className="bg-[#171f33] hover:bg-[#2d3449]/50 text-[#dae2fd] rounded px-3 py-2 text-sm"
                onClick={() => setSaveScope('prompt')}
              >
                Guardar prompt
              </button>
              <button
                className="bg-[#171f33] hover:bg-[#2d3449]/50 text-[#dae2fd] rounded px-3 py-2 text-sm"
                onClick={() => setSaveScope('chat')}
              >
                Guardar chat
              </button>
            </div>
          )}
          <Input
            placeholder="Ej: Mejorar tono formal del sistema"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd] placeholder-[#908fa0] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
          />
          <DialogFooter>
            <button
              className="text-[#c7c4d7] hover:text-[#dae2fd] hover:bg-[#2d3449]/30 px-4 py-2 rounded text-sm transition-colors"
              onClick={() => {
                setCommitDialogOpen(false);
                setSaveScope(null);
              }}
            >
              Cancelar
            </button>
            {promptDirty && chatDirty && saveScope && (
              <button
                className="text-[#c7c4d7] hover:text-[#dae2fd] hover:bg-[#2d3449]/30 px-4 py-2 rounded text-sm transition-colors"
                onClick={() => setSaveScope(null)}
              >
                Cambiar opcion
              </button>
            )}
            <button
              className="bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-bold rounded px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              onClick={() => handleSave()}
              disabled={saving || !saveScope}
            >
              {saving
                ? 'Guardando...'
                : saveScope === 'all'
                  ? 'Guardar todo'
                  : saveScope === 'chat'
                    ? `Guardar chat v${(currentChatVersion?.versionNumber || 0) + 1}`
                    : `Guardar prompt v${(currentVersion?.versionNumber || 0) + 1}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
