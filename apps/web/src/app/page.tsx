import Link from "next/link";
import { Zap, GitBranch, Columns2, Variable } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="flex justify-between items-center mx-auto px-6 max-w-6xl h-16">
          <div className="flex items-center gap-2">
            <div className="flex justify-center items-center bg-primary rounded-lg w-8 h-8 text-primary-foreground">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">Prompt Studio</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-medium text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex justify-center items-center bg-primary hover:bg-primary/90 px-4 rounded-md h-9 font-medium text-primary-foreground text-sm transition-colors"
            >
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto px-6 py-24 max-w-6xl text-center">
          <h1 className="mx-auto max-w-3xl font-bold text-5xl sm:text-6xl tracking-tight">
            Construye prompts de forma{" "}
            <span className="text-primary">visual</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg">
            Diseña, versiona y testea tus prompts de LLM con variables
            dinámicas, comparación side-by-side entre modelos y un historial
            de versiones tipo Git.
          </p>
          <div className="flex justify-center items-center gap-4 mt-10">
            <Link
              href="/register"
              className="inline-flex justify-center items-center bg-primary hover:bg-primary/90 px-6 rounded-md h-11 font-medium text-primary-foreground text-sm transition-colors"
            >
              Comenzar ahora
            </Link>
            <Link
              href="/login"
              className="inline-flex justify-center items-center hover:bg-accent px-6 border rounded-md h-11 font-medium text-sm transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>

        <section className="bg-muted/30 border-t">
          <div className="mx-auto px-6 py-20 max-w-6xl">
            <h2 className="font-bold text-3xl text-center tracking-tight">
              Todo lo que necesitas para tus prompts
            </h2>
            <div className="gap-8 grid sm:grid-cols-2 lg:grid-cols-3 mt-12">
              <div className="bg-card p-6 border rounded-xl">
                <Variable className="w-10 h-10 text-primary" />
                <h3 className="mt-4 font-semibold text-lg">Variables dinámicas</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Define variables con {"{{sintaxis}}"} y prueba diferentes valores
                  en tiempo real sin editar el prompt.
                </p>
              </div>
              <div className="bg-card p-6 border rounded-xl">
                <Columns2 className="w-10 h-10 text-primary" />
                <h3 className="mt-4 font-semibold text-lg">Comparación side-by-side</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Ejecuta el mismo prompt contra GPT-4, Claude y Gemini
                  simultáneamente y compara resultados.
                </p>
              </div>
              <div className="bg-card p-6 border rounded-xl">
                <GitBranch className="w-10 h-10 text-primary" />
                <h3 className="mt-4 font-semibold text-lg">Versionado tipo Git</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Historial completo de cambios con diffs visuales, branches
                  y tags para marcar versiones clave.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="mx-auto px-6 max-w-6xl text-muted-foreground text-sm text-center">
          Prompt Studio v0.1.0
        </div>
      </footer>
    </div>
  );
}
