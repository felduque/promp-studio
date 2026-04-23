'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  FolderKanban,
  FileText,
  Zap,
  Plus,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Bell,
  Braces,
  ArrowRight,
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
  const [velocityFilter, setVelocityFilter] = useState<'24H' | '7D' | '30D'>('7D');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: projects } = await apiClient.get('/projects');
        const projectCount = projects.length;
        const promptCount = projects.reduce(
          (acc: number, p: any) => acc + (p.promptCount || 0), 0,
        );
        setStats({
          projectCount,
          promptCount,
          executionCount: 0,
          recentProjects: projects.slice(0, 5),
        });
      } catch {
        setStats({ projectCount: 0, promptCount: 0, executionCount: 0, recentProjects: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0b1326]">
        <div className="border-4 border-[#c0c1ff] border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  const velocityData = [
    { day: 'Mon', value: 30 },
    { day: 'Tue', value: 45 },
    { day: 'Wed', value: 20 },
    { day: 'Thu', value: 60 },
    { day: 'Fri', value: 85 },
    { day: 'Sat', value: 50 },
    { day: 'Today', value: 75 },
  ];
  const maxVelocity = Math.max(...velocityData.map(d => d.value));

  const quickAccessPrompts = [
    { name: 'JSON_Formatter.v3', vars: ['input', 'schema'] },
    { name: 'Exec_Summary_Gen', vars: ['context'] },
    { name: 'Error_Log_Parser', vars: ['stacktrace'] },
  ];

  const costUsed = 142.50;
  const costLimit = 500;
  const costPercent = (costUsed / costLimit) * 100;

  return (
    <div className="flex-1 p-10 min-h-screen overflow-y-auto bg-[#0b1326]">
      {/* Header */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-[var(--font-space-grotesk)] text-4xl font-bold tracking-tight text-[#dae2fd] mb-1">
            Architect Overview
          </h1>
          <p className="text-[#c7c4d7] text-sm">System nominal. Ready for synthesis.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-[#131b2e] text-[#c0c1ff] p-2.5 rounded-lg hover:bg-[#171f33] transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#4edea3] rounded-full shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#2d3449] border-2 border-[#0b1326] flex items-center justify-center text-[#c0c1ff] text-sm font-bold">
            PS
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Metric Cards — 3 across in 8 cols */}
        <div className="md:col-span-8 grid grid-cols-3 gap-6">
          {/* Total Projects */}
          <div className="bg-[#131b2e] rounded-xl p-6 flex flex-col justify-between hover:bg-[#171f33] transition-colors group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#c0c1ff]/5 rounded-full blur-2xl group-hover:bg-[#c0c1ff]/10 transition-colors" />
            <div className="flex justify-between items-start z-10">
              <span className="text-[#c7c4d7] text-[0.6875rem] uppercase tracking-widest font-semibold">Total Projects</span>
              <FolderKanban className="w-5 h-5 text-[#c0c1ff]/70" />
            </div>
            <div className="mt-6 flex items-end justify-between z-10">
              <span className="font-[var(--font-space-grotesk)] text-4xl text-[#dae2fd] font-bold tracking-tighter">
                {stats?.projectCount || 0}
              </span>
              <span className="text-[#4edea3] text-xs flex items-center bg-[#4edea3]/10 px-2 py-1 rounded">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
              </span>
            </div>
          </div>

          {/* Active Prompts */}
          <div className="bg-[#131b2e] rounded-xl p-6 flex flex-col justify-between hover:bg-[#171f33] transition-colors group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#c0c1ff]/5 rounded-full blur-2xl group-hover:bg-[#c0c1ff]/10 transition-colors" />
            <div className="flex justify-between items-start z-10">
              <span className="text-[#c7c4d7] text-[0.6875rem] uppercase tracking-widest font-semibold">Active Prompts</span>
              <FileText className="w-5 h-5 text-[#c0c1ff]/70" />
            </div>
            <div className="mt-6 flex items-end justify-between z-10">
              <span className="font-[var(--font-space-grotesk)] text-4xl text-[#dae2fd] font-bold tracking-tighter">
                {stats?.promptCount || 0}
              </span>
              <span className="text-[#4edea3] text-xs flex items-center bg-[#4edea3]/10 px-2 py-1 rounded">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +5%
              </span>
            </div>
          </div>

          {/* Total Executions */}
          <div className="bg-[#131b2e] rounded-xl p-6 flex flex-col justify-between hover:bg-[#171f33] transition-colors group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#4edea3]/5 rounded-full blur-2xl group-hover:bg-[#4edea3]/10 transition-colors" />
            <div className="flex justify-between items-start z-10">
              <span className="text-[#c7c4d7] text-[0.6875rem] uppercase tracking-widest font-semibold">Total Executions</span>
              <Zap className="w-5 h-5 text-[#4edea3]/70" />
            </div>
            <div className="mt-6 flex items-end justify-between z-10">
              <span className="font-[var(--font-space-grotesk)] text-4xl text-[#dae2fd] font-bold tracking-tighter">
                {stats?.executionCount ? `${(stats.executionCount / 1000).toFixed(1)}k` : '0'}
              </span>
              <span className="text-[#c7c4d7] text-xs">This month</span>
            </div>
          </div>
        </div>

        {/* Compute Cost Tracker — 4 cols */}
        <div className="md:col-span-4 bg-[#060e20] rounded-xl p-6 flex flex-col shadow-[inset_0_2px_20px_rgba(0,0,0,0.2)] border border-[rgba(70,69,84,0.1)]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#c7c4d7] text-[0.6875rem] uppercase tracking-widest font-semibold">Compute Cost Tracker</span>
            <DollarSign className="w-4 h-4 text-[#c0c1ff]/70" />
          </div>
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="font-[var(--font-space-grotesk)] text-3xl text-[#dae2fd] font-bold tracking-tighter">
                ${costUsed.toFixed(2)}
              </span>
              <span className="text-[#c7c4d7] text-sm">/ ${costLimit} limit</span>
            </div>
            <div className="w-full bg-[#2d3449] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] h-full rounded-full shadow-[0_0_10px_rgba(192,193,255,0.5)]"
                style={{ width: `${costPercent}%` }}
              />
            </div>
            <p className="text-xs text-[#c7c4d7] mt-3">
              Projected to end billing cycle at <span className="text-[#dae2fd] font-medium">$210.00</span>
            </p>
          </div>
        </div>

        {/* Execution Velocity — 8 cols */}
        <div className="md:col-span-8 bg-[#131b2e] rounded-xl p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[#dae2fd]">
              Execution Velocity
            </h2>
            <div className="flex gap-2 bg-[#171f33] p-1 rounded">
              {(['24H', '7D', '30D'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVelocityFilter(filter)}
                  className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                    velocityFilter === filter
                      ? 'bg-[#2d3449] text-[#dae2fd] shadow-sm'
                      : 'text-[#c7c4d7] hover:text-[#dae2fd]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-end gap-3 h-48 mt-auto px-2">
            {velocityData.map((d, i) => (
              <div
                key={d.day}
                className={`w-full rounded-t transition-colors cursor-crosshair ${
                  i === velocityData.length - 1
                    ? 'bg-[#c0c1ff]/80 shadow-[0_0_15px_rgba(192,193,255,0.2)]'
                    : 'bg-[#2d3449] hover:bg-[#c0c1ff]/80'
                }`}
                style={{ height: `${(d.value / maxVelocity) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[0.6rem] text-[#c7c4d7] uppercase tracking-widest mt-4 px-2">
            {velocityData.map(d => <span key={d.day}>{d.day}</span>)}
          </div>
        </div>

        {/* Quick Access — 4 cols */}
        <div className="md:col-span-4 bg-[#131b2e] rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[#dae2fd]">
              Quick Access
            </h2>
            <button className="text-[#c0c1ff] hover:text-[#8083ff] text-sm transition-colors">
              View All
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {quickAccessPrompts.map((p) => (
              <div
                key={p.name}
                className="p-3.5 rounded-lg bg-[#0b1326] hover:bg-[#2d3449] transition-all duration-300 flex items-center justify-between cursor-pointer border border-transparent hover:border-[rgba(70,69,84,0.2)] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#39485a]/30 flex items-center justify-center text-[#c0c1ff]">
                    <Braces className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#dae2fd] group-hover:text-[#c0c1ff] transition-colors">
                      {p.name}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {p.vars.map((v) => (
                        <span key={v} className="bg-[#060e20] text-[#c7c4d7] text-[0.6rem] px-1.5 py-0.5 rounded font-[var(--font-geist-mono)] tracking-tight">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#c7c4d7] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Workspaces — full width */}
        <div className="md:col-span-12 bg-[#131b2e] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[#dae2fd]">
              Recent Workspaces
            </h2>
            <Link
              href="/projects"
              className="bg-transparent text-[#c0c1ff] hover:bg-[#2d3449]/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[rgba(70,69,84,0.2)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Project
            </Link>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 pb-3 mb-3 text-[0.6875rem] uppercase tracking-widest text-[#c7c4d7]/70 border-b border-white/5">
            <div className="col-span-5">Project Name</div>
            <div className="col-span-2">Models Used</div>
            <div className="col-span-2">Prompts</div>
            <div className="col-span-3 text-right">Last Modified</div>
          </div>

          {/* Table rows */}
          <div className="flex flex-col gap-1">
            {stats?.recentProjects.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="w-8 h-8 text-[#464554] mx-auto mb-2" />
                <p className="text-[#c7c4d7] text-sm">No hay proyectos aún</p>
                <Link href="/projects" className="text-[#c0c1ff] text-sm hover:text-[#8083ff] mt-2 inline-block">
                  Crear proyecto →
                </Link>
              </div>
            ) : (
              stats?.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 px-2 -mx-2 hover:bg-[#171f33] transition-colors rounded-lg cursor-pointer group"
                  onClick={() => window.location.href = `/projects/${project.id}`}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#c0c1ff]/10 text-[#c0c1ff] flex items-center justify-center">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-[#dae2fd] group-hover:text-[#c0c1ff] transition-colors">
                      {project.name}
                    </span>
                  </div>
                  <div className="col-span-2 flex gap-1">
                    <span className="bg-[#2d3449] text-xs px-2 py-0.5 rounded-sm text-[#c7c4d7]">GPT-4</span>
                    <span className="bg-[#2d3449] text-xs px-2 py-0.5 rounded-sm text-[#c7c4d7]">Claude 3</span>
                  </div>
                  <div className="col-span-2 text-sm text-[#c7c4d7] font-[var(--font-geist-mono)]">
                    {project.promptCount || 0}
                  </div>
                  <div className="col-span-3 text-right text-sm text-[#c7c4d7]">
                    {new Date(project.updatedAt).toLocaleDateString('es')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
