import Link from "next/link";
import {
  Zap,
  Search,
  Bell,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b1326] text-[#dae2fd] antialiased">
      {/* TopNavBar — fixed, glassmorphic */}
      <header className="fixed top-0 w-full z-50 bg-[#0b1326]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex justify-between items-center px-6 py-3 w-full max-w-7xl mx-auto">
          <div className="text-xl font-bold tracking-tighter text-white font-[var(--font-space-grotesk)]">
            Prompt Studio
          </div>
          <nav className="hidden md:flex items-center gap-8 font-[var(--font-space-grotesk)] tracking-tight">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors hover:bg-white/5 duration-200 px-3 py-2 rounded">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors hover:bg-white/5 duration-200 px-3 py-2 rounded">Pricing</a>
            <a href="#docs" className="text-slate-400 hover:text-white transition-colors hover:bg-white/5 duration-200 px-3 py-2 rounded">Docs</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-[#c7c4d7] hover:text-[#dae2fd] transition-colors p-2 rounded-full hover:bg-[#2d3449]">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-[#c7c4d7] hover:text-[#dae2fd] transition-colors p-2 rounded-full hover:bg-[#2d3449]">
              <Bell className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-3 ml-4">
              <Link href="/login" className="text-[#c0c1ff] hover:bg-[#2d3449]/30 px-4 py-2 rounded-xl transition-all duration-200 text-sm">
                Log In
              </Link>
              <Link href="/register" className="bg-gradient-to-b from-[#c0c1ff] to-[#8083ff] text-[#1000a9] px-5 py-2 rounded-xl text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] active:scale-95 transition-transform">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8083ff]/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#494bd6]/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#060e20] border border-[rgba(70,69,84,0.15)] text-sm font-[var(--font-geist-mono)] text-[#4edea3] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            v2.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-[var(--font-space-grotesk)] font-bold tracking-tighter leading-tight mb-6">
            Construye prompts de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c0c1ff] to-[#8083ff]">
              forma visual
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#c7c4d7] mb-10 max-w-2xl mx-auto leading-relaxed">
            Diseña con variables dinámicas, compara resultados entre modelos en tiempo real y controla versiones como en Git. Todo en un entorno de trabajo profesional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-gradient-to-b from-[#c0c1ff] to-[#8083ff] text-[#1000a9] px-8 py-4 rounded-xl text-base font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all text-center"
            >
              Empezar gratis
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-medium text-[#c0c1ff] bg-[#131b2e] hover:bg-[#2d3449] transition-colors border border-[rgba(70,69,84,0.15)] text-center"
            >
              Ver demo
            </Link>
          </div>
        </div>
      </section>

      {/* UI Demo Screenshot */}
      <section id="demo" className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-[rgba(70,69,84,0.2)] bg-[#060e20]">
            {/* Mac-like window header */}
            <div className="h-10 bg-[#131b2e] flex items-center px-4 border-b border-[rgba(70,69,84,0.1)]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#464554]/50" />
                <div className="w-3 h-3 rounded-full bg-[#464554]/50" />
                <div className="w-3 h-3 rounded-full bg-[#464554]/50" />
              </div>
            </div>
            {/* Mock IDE content */}
            <div className="flex h-[600px]">
              {/* Sidebar */}
              <div className="w-64 bg-[#131b2e] border-r border-[rgba(70,69,84,0.1)] p-4 flex-col gap-4 hidden sm:flex">
                <div className="text-[0.6875rem] uppercase tracking-[0.05em] text-[#c7c4d7] mb-2">Variables</div>
                <div className="bg-[#2d3449] rounded-lg p-3 border border-[rgba(70,69,84,0.15)]">
                  <div className="text-xs font-[var(--font-geist-mono)] text-[#b9c8de] mb-1">{"{{tone}}"}</div>
                  <div className="text-sm">Professional, concise</div>
                </div>
                <div className="bg-[#2d3449] rounded-lg p-3 border border-[rgba(70,69,84,0.15)]">
                  <div className="text-xs font-[var(--font-geist-mono)] text-[#b9c8de] mb-1">{"{{context}}"}</div>
                  <div className="text-sm">SaaS Landing Page</div>
                </div>
              </div>
              {/* Main Editor */}
              <div className="flex-1 bg-[#0b1326] p-8 relative">
                <div className="font-[var(--font-geist-mono)] text-lg leading-loose text-[#c7c4d7]">
                  Act as a <span className="bg-[#39485a] text-[#a7b6cc] px-2 py-0.5 rounded-sm">Expert Copywriter</span>.<br /><br />
                  Write a hero section for a <span className="bg-[#39485a] text-[#a7b6cc] px-2 py-0.5 rounded-sm">{"{{context}}"}</span>.<br /><br />
                  The tone should be <span className="bg-[#39485a] text-[#a7b6cc] px-2 py-0.5 rounded-sm">{"{{tone}}"}</span>.
                </div>
                {/* Floating Action Bar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#2d3449]/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-[rgba(70,69,84,0.2)] flex items-center gap-4 shadow-lg shadow-black/20">
                  <div className="flex items-center gap-2 border-r border-[rgba(70,69,84,0.3)] pr-4">
                    <span className="text-sm font-medium">GPT-4 vs Claude 3</span>
                  </div>
                  <button className="bg-gradient-to-b from-[#c0c1ff] to-[#8083ff] text-[#1000a9] px-4 py-1.5 rounded-lg text-sm font-medium">
                    Run Comparison
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 bg-[#060e20] px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-[var(--font-space-grotesk)] font-bold mb-4">
              Ingeniería sin fricción
            </h2>
            <p className="text-[#c7c4d7] max-w-2xl mx-auto">
              Herramientas diseñadas para escalar tus flujos de trabajo de IA desde el prototipo hasta producción.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Dynamic Variables — 2 cols */}
            <div className="col-span-1 md:col-span-2 bg-[#131b2e] rounded-2xl p-8 border border-[rgba(70,69,84,0.1)] relative overflow-hidden group hover:bg-[#222a3d] transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0c1ff]/5 rounded-full blur-[80px] -z-10 group-hover:bg-[#c0c1ff]/10 transition-colors" />
              <div className="w-12 h-12 bg-[#2d3449] rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 text-[#c0c1ff]" />
              </div>
              <h3 className="text-xl font-[var(--font-space-grotesk)] font-bold mb-3">Dynamic Variables</h3>
              <p className="text-[#c7c4d7] mb-6 max-w-md">
                Inyecta contexto en tiempo real con una sintaxis de plantillas intuitiva. Gestiona bancos de datos de prueba para iterar rápidamente.
              </p>
              <div className="bg-[#0b1326] rounded-lg p-4 border border-[rgba(70,69,84,0.15)] font-[var(--font-geist-mono)] text-sm">
                <div className="text-[#c7c4d7]">System: Translate to <span className="text-[#c0c1ff]">{"{{language}}"}</span></div>
                <div className="mt-2 text-[#c7c4d7]">User: <span className="text-[#b9c8de]">{"{{user_input}}"}</span></div>
              </div>
            </div>

            {/* Feature 2: Git Versioning — 1 col */}
            <div className="col-span-1 bg-[#131b2e] rounded-2xl p-8 border border-[rgba(70,69,84,0.1)] relative overflow-hidden group hover:bg-[#222a3d] transition-colors">
              <div className="w-12 h-12 bg-[#2d3449] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-[#4edea3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4" /><path d="M12 2v6m0 8v6" /></svg>
              </div>
              <h3 className="text-xl font-[var(--font-space-grotesk)] font-bold mb-3">Git-like Versioning</h3>
              <p className="text-[#c7c4d7] mb-6">
                Nunca pierdas un prompt que funcionaba. Ramifica, haz commits y vuelve a versiones anteriores al instante.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-3 text-sm bg-[#0b1326] p-2 rounded border border-[rgba(70,69,84,0.1)] text-[#c7c4d7]">
                  <div className="w-2 h-2 rounded-full bg-[#4edea3]" />
                  v1.2 - Added edge cases
                </div>
                <div className="flex items-center gap-3 text-sm bg-[#0b1326] p-2 rounded border border-[rgba(70,69,84,0.1)] text-[#c7c4d7] opacity-60">
                  <div className="w-2 h-2 rounded-full bg-[#908fa0]" />
                  v1.1 - Initial draft
                </div>
              </div>
            </div>

            {/* Feature 3: Model Comparison — full width */}
            <div className="col-span-1 md:col-span-3 bg-[#131b2e] rounded-2xl p-8 border border-[rgba(70,69,84,0.1)] relative overflow-hidden group hover:bg-[#222a3d] transition-colors flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="w-12 h-12 bg-[#2d3449] rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-[#494bd6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="8" rx="2" /><rect x="3" y="13" width="18" height="8" rx="2" /></svg>
                </div>
                <h3 className="text-xl font-[var(--font-space-grotesk)] font-bold mb-3">Side-by-side Model Comparison</h3>
                <p className="text-[#c7c4d7]">
                  Lanza el mismo prompt a múltiples proveedores simultáneamente. Evalúa calidad, latencia y costo en una sola vista para tomar la mejor decisión arquitectónica.
                </p>
              </div>
              <div className="flex-1 w-full flex gap-4">
                <div className="flex-1 bg-[#0b1326] rounded-lg p-4 border border-[rgba(70,69,84,0.15)]">
                  <div className="text-xs font-[var(--font-geist-mono)] text-[#c7c4d7] mb-2 border-b border-[rgba(70,69,84,0.1)] pb-2">GPT-4 Turbo</div>
                  <div className="text-sm h-24 bg-[#060e20] rounded p-2 text-[#c7c4d7]">Evaluating output...</div>
                </div>
                <div className="flex-1 bg-[#0b1326] rounded-lg p-4 border border-[rgba(70,69,84,0.15)]">
                  <div className="text-xs font-[var(--font-geist-mono)] text-[#c7c4d7] mb-2 border-b border-[rgba(70,69,84,0.1)] pb-2">Claude 3 Opus</div>
                  <div className="text-sm h-24 bg-[#060e20] rounded p-2 text-[#c7c4d7]">Evaluating output...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b1326] border-t border-[rgba(70,69,84,0.1)] pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-xl font-bold tracking-tighter text-white font-[var(--font-space-grotesk)] mb-4">Prompt Studio</div>
            <p className="text-[#c7c4d7] text-sm max-w-sm">
              El entorno de desarrollo profesional para ingeniería de prompts. Construye, evalúa y despliega IA con confianza.
            </p>
          </div>
          <div>
            <div className="text-[0.6875rem] uppercase tracking-[0.05em] text-[#c7c4d7] mb-4">Producto</div>
            <ul className="flex flex-col gap-3 text-sm">
              <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Características</a></li>
              <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Precios</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[0.6875rem] uppercase tracking-[0.05em] text-[#c7c4d7] mb-4">Recursos</div>
            <ul className="flex flex-col gap-3 text-sm">
              <li><a href="#docs" className="text-slate-400 hover:text-white transition-colors">Documentación</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Guías de Prompting</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Comunidad</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[rgba(70,69,84,0.1)] text-xs text-[#c7c4d7]">
          <div>© 2024 Prompt Studio. Todos los derechos reservados.</div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
