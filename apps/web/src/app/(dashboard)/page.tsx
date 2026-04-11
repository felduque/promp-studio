'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  FileText,
  Zap,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  projectCount: number;
  promptCount: number;
  executionCount: number;
  recentProjects: {
    id: string;
    name: string;
    promptCount: number;
    updatedAt: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: projects } = await apiClient.get('/projects');
        const projectCount = projects.length;
        const promptCount = projects.reduce(
          (acc: number, p: any) => acc + (p.promptCount || 0),
          0,
        );
        setStats({
          projectCount,
          promptCount,
          executionCount: 0,
          recentProjects: projects.slice(0, 5),
        });
      } catch {
        setStats({
          projectCount: 0,
          promptCount: 0,
          executionCount: 0,
          recentProjects: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Proyectos',
      value: stats?.projectCount || 0,
      icon: FolderKanban,
      href: '/projects',
      color: 'text-blue-500',
    },
    {
      title: 'Prompts',
      value: stats?.promptCount || 0,
      icon: FileText,
      href: '/projects',
      color: 'text-violet-500',
    },
    {
      title: 'Ejecuciones',
      value: stats?.executionCount || 0,
      icon: Zap,
      href: '/projects',
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu actividad en Prompt Studio
          </p>
        </div>
        <Link href="/projects">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proyecto
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-colors hover:border-primary/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Proyectos recientes
              </CardTitle>
              <CardDescription>
                Tus últimos proyectos actualizados
              </CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No tienes proyectos aún. ¡Crea tu primero!
              </p>
              <Link href="/projects" className="mt-3">
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Crear proyecto
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.promptCount || 0} prompts
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString('es')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
