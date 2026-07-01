# SaaSify — Replit Runtime Notes

> For full project context, see `AGENTS.md`.

## Running the App

The application runs as a single unified server (Express + Vite middleware) on port 5000.

- **Dev command:** `npm run dev:node`
- **Build command:** `npm run build`
- **Production start:** `node dist/index.cjs`

## Required Secrets

Before the app will function, configure these in Replit Secrets:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |

## Setup Steps

1. Create a Supabase project at https://supabase.com
2. Add the three secrets above in the Replit Secrets panel
3. Run `supabase_setup.sql` in the Supabase SQL Editor to initialize tables + RLS
4. Restart the workflow — the app will be fully functional

## Architecture

- **Frontend:** React + TypeScript + Vite (client/)
- **Backend:** Express shell for static serving, health checks, and admin endpoints (server/)
- **Auth & DB:** Supabase (frontend talks directly via SDK)
- **Styling:** Tailwind CSS + shadcn/ui

## Deployment

- Target: `autoscale`
- Build: `npm run build`
- Run: `node dist/index.cjs`
