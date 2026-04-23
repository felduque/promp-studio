'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  FolderKanban,
  Settings,
  KeyRound,
  BarChart3,
  History,
  HelpCircle,
  FileText,
  Plus,
} from 'lucide-react';

const overviewItems = [
  { title: 'PROJECTS', href: '/projects', icon: FolderKanban },
  { title: 'HISTORY', href: '/history', icon: History },
  { title: 'ANALYTICS', href: '/analytics', icon: BarChart3 },
];

const configItems = [
  { title: 'API KEYS', href: '/settings/api-keys', icon: KeyRound },
  { title: 'SETTINGS', href: '/settings', icon: Settings },
];

const bottomItems = [
  { title: 'HELP', href: '/help', icon: HelpCircle },
  { title: 'DOCUMENTATION', href: '/docs', icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-screen w-64 flex flex-col bg-[#131b2e] shadow-2xl shadow-indigo-900/10 shrink-0">
      {/* Logo */}
      <div className="px-4 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c0c1ff] to-[#8083ff] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <FolderKanban className="w-4 h-4 text-[#1000a9]" />
        </div>
        <div>
          <div className="text-sm font-black text-white uppercase tracking-wider leading-none">
            Prompt Studio
          </div>
          <div className="text-[0.6rem] text-[#c0c1ff] mt-1 opacity-80">
            Pro Workspace
          </div>
        </div>
      </div>

      {/* New Prompt Button */}
      <div className="px-4 mb-6">
        <Link
          href="/projects"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-semibold py-2.5 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_16px_rgba(192,193,255,0.1)] hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col text-sm font-medium uppercase tracking-[0.05em] overflow-y-auto">
        {/* Overview section */}
        <div className="px-4 mb-2 text-[0.6875rem] text-[#c7c4d7]/50 tracking-widest uppercase">
          Overview
        </div>
        {overviewItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mx-2 my-1 px-4 py-3 flex items-center gap-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#2d3449] text-white shadow-md shadow-black/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#2d3449]/50'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#c0c1ff]' : ''}`} />
              {item.title}
            </Link>
          );
        })}

        {/* Configuration section */}
        <div className="px-4 mt-8 mb-2 text-[0.6875rem] text-[#c7c4d7]/50 tracking-widest uppercase">
          Configuration
        </div>
        {configItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mx-2 my-1 px-4 py-3 flex items-center gap-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#2d3449] text-white shadow-md shadow-black/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#2d3449]/50'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#c0c1ff]' : ''}`} />
              {item.title}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="mt-auto pt-4 pb-6 border-t border-white/5 text-sm font-medium uppercase tracking-[0.05em]">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-slate-400 hover:text-white mx-2 my-1 px-4 py-3 flex items-center gap-3 rounded-lg transition-colors hover:bg-[#2d3449]/50 duration-200"
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
