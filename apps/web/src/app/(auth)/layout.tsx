export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1326] text-[#dae2fd] relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#8083ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-[#00885d]/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="w-full max-w-md p-6 z-10 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full flex justify-between items-center px-12 py-6 mt-auto z-20">
        <div className="text-sm font-bold text-[#c0c1ff] font-[var(--font-space-grotesk)] tracking-tight">
          © 2024 Prompt Studio
        </div>
        <nav className="flex gap-6">
          {['Privacy', 'Terms', 'Docs'].map((link) => (
            <a key={link} href="#" className="text-[#64748b] hover:text-[#94a3b8] transition-opacity text-[0.6875rem] uppercase tracking-[0.05em]">
              {link}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
