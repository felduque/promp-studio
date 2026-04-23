'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, FolderKanban, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string;
  promptCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await apiClient.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      await apiClient.post('/projects', newProject);
      toast.success(`Proyecto "${newProject.name}" creado`);
      setNewProject({ name: '', description: '' });
      setDialogOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Error al crear el proyecto');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ps-bg-base overflow-y-auto ps-editor-scroll">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 px-8 py-6 shrink-0">
        <div className="min-w-0">
          <h1 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl sm:text-3xl tracking-tight">
            Projects
          </h1>
          <p className="text-ps-text-muted text-sm mt-1">
            Gestiona tus colecciones de prompts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button variant="gradient" size="lg" />}>
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </DialogTrigger>
          <DialogContent className="bg-ps-bg-surface/95 backdrop-blur-xl border-ps-border shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <DialogHeader>
              <DialogTitle className="text-ps-text-primary font-[var(--font-space-grotesk)]">Crear proyecto</DialogTitle>
              <DialogDescription className="text-ps-text-muted">
                Un proyecto agrupa prompts relacionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Nombre</Label>
                <Input
                  placeholder="Mi proyecto de prompts"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="bg-ps-bg-deep border-ps-border text-ps-text-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Descripción</Label>
                <Textarea
                  placeholder="Describe tu proyecto..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="bg-ps-bg-deep border-ps-border text-ps-text-primary resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost-ps" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handleCreate} disabled={creating || !newProject.name.trim()}>
                {creating ? 'Creando...' : 'Crear proyecto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 px-8 pb-8">
        {loading ? (
          <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="rounded-lg h-40 bg-ps-bg-surface" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20">
            <FolderKanban className="w-12 h-12 text-ps-text-muted/30 mb-3" />
            <h3 className="font-[var(--font-space-grotesk)] font-semibold text-ps-text-primary text-lg">
              Sin proyectos aún
            </h3>
            <p className="text-ps-text-muted text-sm mt-1">
              Crea tu primer proyecto para empezar a construir prompts.
            </p>
            <Button variant="link" className="mt-4 text-ps-accent" onClick={() => setDialogOpen(true)}>
              Crear proyecto →
            </Button>
          </div>
        ) : (
          <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-5 hover:border-ps-border hover:shadow-lg transition-all cursor-pointer h-full group">
                  <div className="flex items-center gap-2.5 mb-3">
                    <FolderKanban className="w-5 h-5 text-ps-accent" />
                    <h3 className="font-medium text-ps-text-primary group-hover:text-ps-accent transition-colors truncate">
                      {project.name}
                    </h3>
                  </div>
                  <p className="text-ps-text-muted text-sm line-clamp-2 mb-4">
                    {project.description || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-2 text-ps-text-muted text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    {project.promptCount || 0} prompts
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
