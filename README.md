# Prompt Studio
<!-- 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 -->
Visual builder para prompts de LLMs — construye, versiona y testea prompts con variables dinámicas, comparación side-by-side y versionado tipo Git.

## Stack

- **Frontend:** Next.js 14, React 18, TailwindCSS, shadcn/ui
- **Backend:** NestJS, TypeORM, PostgreSQL 16
- **LLM Orchestrator:** Model Orchestrator propio (OpenAI, Anthropic, Groq, OpenRouter, Google, Mistral)
- **Infra:** Docker Compose

## Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar PostgreSQL
docker compose up -d postgres

# 4. Iniciar ambos servidores en modo desarrollo
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000

## Estructura

```
prompt-studio/
├── apps/
│   ├── web/    # Next.js frontend
│   └── api/    # NestJS backend
├── docker-compose.yml
└── docs/
```
