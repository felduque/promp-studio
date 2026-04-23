'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePromptStore } from '@/lib/stores/prompt-store';
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
import { Save } from 'lucide-react';

interface PromptData {
  id: string;
  name: string;
  projectId: string;
  currentVersionId: string | null;
  defaultModel: string | null;
  versions: VersionData[];
}

interface VersionData {
  id: string;
  versionNumber: number;
  content: string;
  variables: any[];
  messages: any[];
  commitMessage: string;
  tag: string | null;
  createdAt: string;
  author?: { name: string };
}

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
    variables,
    messages,
    isDirty,
    editorMode,
    setContent,
    setVariables,
    setMessages,
    resetDirty,
  } = usePromptStore();

  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('execute');

  const fetchPrompt = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/prompts/${promptId}`);
      setPrompt(data);

      if (data.versions && data.versions.length > 0) {
        const latest = data.versions.sort(
          (a: VersionData, b: VersionData) => b.versionNumber - a.versionNumber,
        )[0];
        setContent(latest.content || '');
        if (latest.variables?.length) setVariables(latest.variables);
        if (latest.messages?.length) setMessages(latest.messages);
      }
      resetDirty();
    } catch {
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  }, [promptId, projectId, router, setContent, setVariables, setMessages, resetDirty]);

  useEffect(() => {
    setLoading(true);
    setContent('');
    setVariables([]);
    setMessages([]);
  }, [promptId, setContent, setVariables, setMessages]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) setCommitDialogOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setActiveTab('execute');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty]);

  const handleSave = async () => {
    if (!commitMessage.trim()) return;
    setSaving(true);
    try {
      await apiClient.post(`/prompts/${promptId}/versions`, {
        content,
        variables: variables.map(({ value, ...rest }) => rest),
        messages,
        commitMessage,
      });
      toast.success(`Versión guardada: ${commitMessage}`);
      setCommitMessage('');
      setCommitDialogOpen(false);
      resetDirty();
      fetchPrompt();
    } catch (err) {
      console.error('Error saving version:', err);
      toast.error('Error al guardar la versión');
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

  const currentVersion = prompt.versions?.sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];

  return (
    <div className="flex flex-col h-full bg-ps-bg-base">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-[#060e20] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
            {prompt.name}
          </h1>
          {currentVersion && (
            <span className="bg-[#39485a] text-[#a7b6cc] px-2 py-0.5 rounded text-xs font-bold font-[var(--font-geist-mono)] uppercase tracking-wider">
              V{currentVersion.versionNumber}
            </span>
          )}
          <span className="font-[var(--font-geist-mono)] text-sm text-[#464554] ml-2">
            {currentVersion
              ? `Edited ${getTimeAgo(currentVersion.createdAt)}`
              : 'New prompt'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isDirty && (
            <button
              className="text-[#c0c1ff] hover:bg-[#2d3449]/30 px-4 py-2 rounded text-sm transition-colors"
              onClick={() => {
                if (currentVersion) {
                  setContent(currentVersion.content || '');
                  if (currentVersion.variables?.length) setVariables(currentVersion.variables);
                  if (currentVersion.messages?.length) setMessages(currentVersion.messages);
                  resetDirty();
                }
              }}
            >
              Discard Changes
            </button>
          )}
          <button
            className="bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-bold rounded px-6 py-2 shadow-[0_4px_14px_rgba(192,193,255,0.2)] hover:shadow-[0_6px_20px_rgba(192,193,255,0.3)] transition-all flex items-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => isDirty && setCommitDialogOpen(true)}
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
          <PromptEditor />
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
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#c0c1ff] border-b-2 border-[#c0c1ff] bg-[#2d3449]/50 font-bold'
                    : 'text-[#c7c4d7] hover:text-[#dae2fd]'
                }`}
              >
                {tab.label}
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
            {activeTab === 'preview' && (
              <PromptPreview />
            )}
            {activeTab === 'history' && (
              <ScrollArea className="h-full p-6">
                <div className="space-y-3">
                  {prompt.versions
                    ?.sort((a, b) => b.versionNumber - a.versionNumber)
                    .map((version) => (
                      <button
                        key={version.id}
                        className="w-full text-left p-4 rounded-xl bg-[#171f33] hover:bg-[#2d3449]/30 border border-[rgba(70,69,84,0.15)] transition-all"
                        onClick={() => {
                          setContent(version.content);
                          if (version.variables?.length) setVariables(version.variables);
                          if (version.messages?.length) setMessages(version.messages);
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
                  {(!prompt.versions || prompt.versions.length === 0) && (
                    <p className="py-8 text-[#c7c4d7] text-sm text-center">
                      Sin versiones aún. Guarda tu primera versión.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
            {activeTab === 'diff' && (
              <VersionDiff versions={prompt.versions ?? []} />
            )}
            {activeTab === 'execute' && (
              <ExecutionPanel
                promptId={prompt.id}
                promptVersionId={prompt.currentVersionId}
                defaultModel={prompt.defaultModel}
                isDirty={isDirty}
                editorMode={editorMode}
                currentContent={content}
                currentMessages={messages}
                onSaveAndExecute={() => setCommitDialogOpen(true)}
              />
            )}
          </div>
        </section>
      </div>

      {/* Save dialog */}
      <Dialog open={commitDialogOpen} onOpenChange={setCommitDialogOpen}>
        <DialogContent className="bg-[#131b2e] border-[rgba(70,69,84,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#dae2fd]">Guardar nueva versión</DialogTitle>
            <DialogDescription className="text-[#c7c4d7]">
              Describe los cambios en esta versión del prompt.
            </DialogDescription>
          </DialogHeader>
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
              onClick={() => setCommitDialogOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-bold rounded px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              onClick={handleSave}
              disabled={saving || !commitMessage.trim()}
            >
              {saving ? 'Guardando...' : `Guardar v${(currentVersion?.versionNumber || 0) + 1}`}
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
