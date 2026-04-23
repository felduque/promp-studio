'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  ArrowLeft,
  Clock,
  GitBranch,
  Trash2,
  Search,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  currentVersionId: string | null;
  versions: { id: string; versionNumber: number; commitMessage: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  prompts: Prompt[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProject = async () => {
    try {
      const { data } = await apiClient.get(`/projects/${projectId}`);
      setProject(data);
    } catch {
      toast.error('No se pudo cargar el proyecto');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const filteredPrompts = useMemo(() => {
    if (!project?.prompts) return [];
    if (!searchQuery.trim()) return project.prompts;
    const q = searchQuery.toLowerCase();
    return project.prompts.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }, [project?.prompts, searchQuery]);

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post('/prompts', {
        name: newPromptName,
        projectId,
      });
      toast.success(`Prompt "${newPromptName}" creado`);
      setNewPromptName('');
      setDialogOpen(false);
      fetchProject();
    } catch (err) {
      console.error('Error creating prompt:', err);
      toast.error('Error al crear el prompt');
    } finally {
      setCreating(false);
    }
  };

  const confirmDeletePrompt = (prompt: Prompt) => {
    setPromptToDelete(prompt);
    setDeleteDialogOpen(true);
  };

  const handleDeletePrompt = async () => {
    if (!promptToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/prompts/${promptToDelete.id}`);
      toast.success(`Prompt "${promptToDelete.name}" eliminado`);
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
      fetchProject();
    } catch (err) {
      console.error('Error deleting prompt:', err);
      toast.error('Error al eliminar el prompt');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 mx-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl">
        <div className="space-y-3">
          <Skeleton className="w-32 h-9 bg-ps-bg-surface" />
          <Skeleton className="w-64 h-8 bg-ps-bg-surface" />
          <Skeleton className="w-96 h-5 bg-ps-bg-surface" />
        </div>
        <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="rounded-xl h-44 bg-ps-bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col gap-6 mx-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl overflow-y-auto ps-editor-scroll h-full bg-ps-bg-base">
      {/* Navigation */}
      <div>
        <Button variant="ghost-ps" size="sm" className="-ml-2 mb-3" onClick={() => router.push('/projects')}>
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
        </Button>

        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl sm:text-3xl tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1.5 max-w-2xl text-ps-text-muted text-base">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-ps-bg-elevated px-3 py-1 rounded text-ps-text-secondary text-sm flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {project.prompts.length} prompt{project.prompts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button variant="gradient" size="lg" />}>
              <Plus className="w-4 h-4" />
              Nuevo prompt
            </DialogTrigger>
            <DialogContent className="bg-ps-bg-surface/95 backdrop-blur-xl border-ps-border shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              <DialogHeader>
                <DialogTitle className="text-ps-text-primary font-[var(--font-space-grotesk)]">Crear nuevo prompt</DialogTitle>
                <DialogDescription className="text-ps-text-muted">
                  Dale un nombre descriptivo a tu prompt para identificarlo fácilmente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Nombre del prompt</Label>
                  <Input
                    id="prompt-name"
                    placeholder="Ej: Generador de emails, Resumen de texto..."
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePrompt()}
                    autoFocus
                    className="bg-ps-bg-deep border-ps-border text-ps-text-primary"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost-ps" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="gradient" onClick={handleCreatePrompt} disabled={creating || !newPromptName.trim()}>
                  {creating ? 'Creando...' : 'Crear prompt'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search bar */}
      {project.prompts.length > 0 && (
        <div className="relative max-w-md">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-ps-text-muted -translate-y-1/2" />
          <Input
            placeholder="Buscar prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-ps-bg-surface border-ps-border text-ps-text-primary placeholder:text-ps-text-muted"
          />
        </div>
      )}

      {/* Prompts grid */}
      {project.prompts.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 border-2 border-dashed border-ps-border rounded-xl">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="flex justify-center items-center bg-ps-accent/10 rounded-full w-16 h-16">
              <Sparkles className="w-8 h-8 text-ps-accent" />
            </div>
            <div>
              <h3 className="font-[var(--font-space-grotesk)] font-semibold text-ps-text-primary text-lg">Comienza creando tu primer prompt</h3>
              <p className="mt-1.5 text-ps-text-muted text-sm">
                Los prompts te permiten construir, versionar y probar interacciones con modelos de IA.
              </p>
            </div>
            <Button variant="gradient" size="lg" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Crear mi primer prompt
            </Button>
          </div>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="w-10 h-10 text-ps-text-muted/30" />
          <p className="text-ps-text-muted text-base">
            No se encontraron prompts con &quot;{searchQuery}&quot;
          </p>
          <Button variant="link" className="text-ps-accent" onClick={() => setSearchQuery('')}>
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => {
            const latestVersion = prompt.versions?.sort(
              (a, b) => b.versionNumber - a.versionNumber
            )[0];
            return (
              <div
                key={prompt.id}
                className="group relative bg-ps-bg-surface border border-ps-border-subtle rounded-lg hover:border-ps-accent/40 hover:shadow-lg transition-all"
              >
                <Link
                  href={`/projects/${projectId}/prompts/${prompt.id}`}
                  className="block p-5"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex justify-center items-center bg-ps-accent/10 rounded-lg w-8 h-8 shrink-0">
                      <FileText className="w-4 h-4 text-ps-accent" />
                    </div>
                    <span className="font-medium text-ps-text-primary truncate">{prompt.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-ps-text-muted text-sm">
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        {prompt.versions?.length || 0} versiones
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeDate(prompt.updatedAt)}
                      </span>
                    </div>
                    {latestVersion && (
                      <div className="flex items-center gap-2">
                        <span className="bg-ps-bg-deep px-2 py-0.5 rounded font-mono text-xs text-ps-accent">
                          v{latestVersion.versionNumber}
                        </span>
                        {latestVersion.commitMessage && (
                          <span className="text-ps-text-muted text-xs truncate">
                            {latestVersion.commitMessage}
                          </span>
                        )}
                      </div>
                    )}
                    {!latestVersion && (
                      <span className="bg-ps-bg-elevated px-2 py-0.5 rounded text-xs text-ps-text-muted">
                        Sin versiones
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  className="top-3 right-3 absolute p-1.5 rounded hover:bg-ps-bg-elevated opacity-0 group-hover:opacity-100 text-ps-text-muted hover:text-ps-error transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDeletePrompt(prompt);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-ps-bg-surface/95 backdrop-blur-xl border-ps-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ps-text-primary">
              <AlertTriangle className="w-5 h-5 text-ps-error" />
              Eliminar prompt
            </DialogTitle>
            <DialogDescription className="text-ps-text-muted">
              ¿Estás seguro de que quieres eliminar <strong className="text-ps-text-primary">&quot;{promptToDelete?.name}&quot;</strong>?
              Esta acción eliminará todas sus versiones y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost-ps" onClick={() => { setDeleteDialogOpen(false); setPromptToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="destructive-ps" onClick={handleDeletePrompt} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
