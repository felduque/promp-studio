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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Save,
  GitBranch,
  GitCompareArrows,
  Eye,
  Variable,
  Clock,
  Play,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('variables');

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
    // Reset loading state immediately when promptId changes
    setLoading(true);
    // Clear store content immediately to avoid showing previous prompt
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
      setCommitMessage('');
      setCommitDialogOpen(false);
      resetDirty();
      fetchPrompt();
    } catch (err) {
      console.error('Error saving version:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="border-4 border-primary border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!prompt) return null;

  const currentVersion = prompt.versions?.sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];

  return (
    <div className="flex flex-col h-[calc(100vh-1px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 border-b">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-lg truncate">{prompt.name}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              {currentVersion && (
                <>
                  <Badge variant="outline" className="px-1.5 text-[10px]">
                    v{currentVersion.versionNumber}
                  </Badge>
                  {currentVersion.tag && (
                    <Badge className="hidden sm:inline-flex px-1.5 text-[10px]">{currentVersion.tag}</Badge>
                  )}
                  <span className="hidden sm:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(currentVersion.createdAt).toLocaleString('es')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Badge variant="secondary" className="text-[10px] animate-pulse">
              Sin guardar
            </Badge>
          )}
          <Button
            size="sm"
            disabled={!isDirty}
            onClick={() => setCommitDialogOpen(true)}
          >
            <Save className="sm:mr-1 w-4 h-4" />
            <span className="hidden sm:inline">Guardar versión</span>
          </Button>
        </div>
      </div>

      {/* Main content — vertical on mobile, horizontal on lg+ */}
      <div className="flex lg:flex-row flex-col flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <div className="flex-1 p-2 sm:p-4 min-h-62.5 lg:min-h-0">
            <PromptEditor />
          </div>
        </div>

        {/* Right / Bottom panel */}
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l w-full lg:w-85 xl:w-95 h-[50vh] sm:h-[55vh] lg:h-full min-h-0 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid grid-cols-5 mx-2 mt-2">
              <TabsTrigger value="variables" className="gap-1 text-xs">
                <Variable className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Variables</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1 text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs">
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="diff" className="gap-1 text-xs">
                <GitCompareArrows className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Diff</span>
              </TabsTrigger>
              <TabsTrigger value="execute" className="gap-1 text-xs">
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ejecutar</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="variables" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="p-3 h-full">
                <VariablesPanel />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0 overflow-hidden">
              <PromptPreview />
            </TabsContent>

            <TabsContent value="execute" className="flex-1 mt-0 overflow-hidden">
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
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="p-3 h-full">
                <div className="space-y-3">
                  {prompt.versions
                    ?.sort((a, b) => b.versionNumber - a.versionNumber)
                    .map((version) => (
                      <button
                        key={version.id}
                        className="p-3 border hover:border-primary/50 rounded-lg w-full text-left transition-colors"
                        onClick={() => {
                          setContent(version.content);
                          if (version.variables?.length)
                            setVariables(version.variables);
                          if (version.messages?.length)
                            setMessages(version.messages);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            v{version.versionNumber}
                          </Badge>
                          {version.tag && (
                            <Badge className="text-xs">{version.tag}</Badge>
                          )}
                        </div>
                        {version.commitMessage && (
                          <p className="mt-1 text-sm">{version.commitMessage}</p>
                        )}
                        <p className="mt-1 text-muted-foreground text-xs">
                          {new Date(version.createdAt).toLocaleString('es')}
                          {version.author && ` · ${version.author.name}`}
                        </p>
                      </button>
                    ))}
                  {(!prompt.versions || prompt.versions.length === 0) && (
                    <p className="py-8 text-muted-foreground text-sm text-center">
                      Sin versiones aún. Guarda tu primera versión.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="diff" className="flex-1 mt-0 overflow-hidden">
              <VersionDiff versions={prompt.versions ?? []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Save dialog */}
      <Dialog open={commitDialogOpen} onOpenChange={setCommitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar nueva versión</DialogTitle>
            <DialogDescription>
              Describe los cambios en esta versión del prompt.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Ej: Mejorar tono formal del sistema"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommitDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !commitMessage.trim()}>
              {saving ? 'Guardando...' : `Guardar v${(currentVersion?.versionNumber || 0) + 1}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
