'use client';

import Link from 'next/link';
import { User, Sliders, KeyRound, ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Profile',
    description: 'Nombre, email, avatar y contraseña',
    href: '/settings/profile',
    icon: User,
    color: '#c0c1ff',
  },
  {
    title: 'Preferences',
    description: 'Temperature, max tokens, tema y editor',
    href: '/settings/preferences',
    icon: Sliders,
    color: '#4edea3',
  },
  {
    title: 'API Keys',
    description: 'Configura tus proveedores de LLM',
    href: '/settings/api-keys',
    icon: KeyRound,
    color: '#8083ff',
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full bg-[#0b1326] overflow-y-auto ps-editor-scroll">
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
          Settings
        </h1>
        <p className="text-[#c7c4d7] text-sm mt-1">
          Configura tu cuenta y entorno de trabajo
        </p>
      </header>

      <div className="flex-1 px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="bg-[#131b2e] rounded-xl p-6 border border-[rgba(70,69,84,0.1)] hover:bg-[#171f33] transition-all group cursor-pointer h-full flex flex-col">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${s.color}10` }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h3 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-lg mb-1 group-hover:text-[#c0c1ff] transition-colors">
                  {s.title}
                </h3>
                <p className="text-[#c7c4d7] text-sm flex-1">{s.description}</p>
                <div className="mt-4 flex items-center gap-1 text-[#c0c1ff] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Configurar <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
