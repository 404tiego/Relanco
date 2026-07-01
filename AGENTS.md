# AGENTS.md — SaaSify (Supabase Boilerplate)

This is the canonical context file for AI coding assistants in this repository (Claude Code, Cursor, Replit Agent, and similar tools).

Tool-specific context files should stay minimal and defer to this file.

## Overview

SaaSify is a high-performance, minimalist SaaS boilerplate using **Supabase** as the single provider for database and authentication.

Architecture is frontend-first: the React app communicates directly with Supabase for auth and most data operations, while the Express backend stays lightweight (static assets, health checks, and server-only operations).

## Non-negotiable constraints

1. **Supabase only** for database and authentication.
2. **No local/Replit development database usage** for app data.
3. **Drizzle ORM is for schema/types only** in this project context.
4. **RLS is enforced in Supabase** and should be part of the default design.
5. **Frontend-first CRUD** when safely possible via Supabase SDK + RLS.
6. **`SUPABASE_SERVICE_ROLE_KEY` is server-only** and must never be exposed in client bundles.

## Tech stack

- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui + Framer Motion
- Routing: `wouter`
- Async/server state: `@tanstack/react-query`
- Backend shell: Node.js + Express
- Data/Auth provider: Supabase (`@supabase/supabase-js`)

## Required environment variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)

## Setup

1. Create a Supabase project.
2. Configure environment variables.
3. Run `supabase_setup.sql` in the Supabase SQL Editor.
4. Start the app with `npm run dev` (or the host platform workflow that runs this command).

## Project structure

```text
├── client/
│   ├── src/
│   │   ├── components/  # UI components (layout, dashboard)
│   │   ├── hooks/       # useAuth, useSupabase (React Query)
│   │   ├── lib/         # Supabase client singleton
│   │   └── pages/       # Landing, Auth, Dashboard, Admin
├── shared/
│   └── schema.ts        # Data model source of truth
└── supabase_setup.sql   # Idempotent DB setup script
```

## Admin access

To grant admin rights to a user:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'user@example.com';
```

## Adapter files

- `replit.md`: Replit-specific runtime notes only
- `CLAUDE.md`: Claude Code-specific runtime notes only
- `.cursor/rules/*`: Cursor-specific rule format only

These adapter files should reference this `AGENTS.md` file instead of duplicating full project guidance.
