'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
  const [newPromptName, setNewPromptName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProject = async () => {
    try {
      const { data } = await apiClient.get(`/projects/${projectId}`);
      setProject(data);
    } catch {
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post('/prompts', {
        name: newPromptName,
        projectId,
      });
      setNewPromptName('');
      setDialogOpen(false);
      fetchProject();
    } catch (err) {
      console.error('Error creating prompt:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('¿Eliminar este prompt?')) return;
    try {
      await apiClient.delete(`/prompts/${promptId}`);
      fetchProject();
    } catch (err) {
      console.error('Error deleting prompt:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-96 h-4" />
        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="rounded-lg h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => router.push('/projects')}
        >
          <ArrowLeft className="mr-1 w-4 h-4" />
          Proyectos
        </Button>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="min-w-0">
            <h1 className="font-bold text-2xl sm:text-3xl truncate tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                {project.description}
              </p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 w-4 h-4" />
              Nuevo prompt
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear prompt</DialogTitle>
                <DialogDescription>
                  Dale un nombre a tu nuevo prompt.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Nombre</Label>
                  <Input
                    id="prompt-name"
                    placeholder="Ej: Generador de emails"
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePrompt()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreatePrompt} disabled={creating}>
                  {creating ? 'Creando...' : 'Crear prompt'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {project.prompts.length === 0 ? (
        <Card className="flex flex-col justify-center items-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground/50" />
          <CardHeader className="text-center">
            <CardTitle>Sin prompts aún</CardTitle>
            <CardDescription>
              Crea tu primer prompt para empezar a construir.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
          {project.prompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="group relative hover:shadow-md hover:border-primary/50 transition-colors"
            >
              <Link href={`/projects/${projectId}/prompts/${prompt.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-primary" />
                    {prompt.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {prompt.versions?.length || 0} versiones
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(prompt.updatedAt).toLocaleDateString('es')}
                    </span>
                  </div>
                  {prompt.versions?.[0]?.commitMessage && (
                    <Badge variant="secondary" className="mt-3 text-xs">
                      {prompt.versions[0].commitMessage}
                    </Badge>
                  )}
                </CardContent>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="top-2 right-2 absolute opacity-0 group-hover:opacity-100 w-7 h-7 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeletePrompt(prompt.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
