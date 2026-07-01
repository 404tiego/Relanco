# Threat Model

## Project Overview

Relanco is a Supabase-backed SaaS for car dealerships. A React/Vite frontend handles most user auth and data access directly with Supabase, while a Node/Express server serves the app and exposes server-side routes for registration, admin functions, AI-assisted lead handling, Stripe checkout, SMS sending, and extension downloads.

The current production deployment is `autoscale` and `private`. Replit infrastructure therefore blocks public-internet access to the app, but every route shipped in `server/routes.ts` should still be treated as production-reachable by users or anyone with deployment access.

## Assets

- **User accounts and sessions** — Supabase users, bearer tokens, refresh tokens, admin sessions, and Chrome extension login state. Compromise enables account takeover and privileged use of the SaaS.
- **Customer and dealership data** — profiles, concessions, leads, clients, relances, and reports. This includes contact details and commercially sensitive follow-up data.
- **Privileged Supabase capabilities** — the server holds the Supabase service-role key and can bypass RLS. Any route that misuses this capability can expose or alter all tenant data.
- **Third-party billing and messaging resources** — Anthropic, Stripe, and Twilio keys represent spendable external-service privileges and can be abused for cost, fraud, or messaging misuse.
- **Administrative authority** — admin role assignment, auth session revocation, and access to all profiles are high-impact capabilities that must stay tightly scoped.

## Trust Boundaries

- **Browser / Chrome extension to Express server** — all request bodies, headers, Origin values, and bearer tokens are untrusted until validated server-side.
- **Browser to Supabase directly** — the client uses Supabase with the anon key; RLS is the primary data isolation control for most CRUD paths.
- **Express server to Supabase service-role client** — `server/routes.ts` can bypass RLS with `SUPABASE_SERVICE_ROLE_KEY`; mistakes here become full-tenant compromise paths.
- **Authenticated user / admin boundary** — admin-only user management and debug flows must be enforced server-side, not only in React route guards.
- **App / external providers boundary** — Anthropic, Stripe, and Twilio calls spend money or send messages; public or weakly gated endpoints can be abused even without direct data exposure.
- **Private deployment / internet boundary** — the private deployment meaningfully reduces anonymous internet exposure, but it is not a substitute for app-level auth on sensitive routes.

## Scan Anchors

- Production server entry: `server/index.ts`; primary route surface: `server/routes.ts`.
- Direct-to-Supabase client access lives in `client/src/hooks/use-auth.tsx`, `client/src/hooks/use-supabase.ts`, and `client/src/hooks/use-admin-profiles.ts`.
- RLS and admin helper functions live in `supabase_setup.sql`.
- Chrome extension surface lives in `chrome-extension/*` and is trusted by users while running on third-party messaging domains; pair it with `/api/auth/login` and `/api/agent/qualify-lead` during scans.
- Public surfaces: landing page, registration/login, checkout creation, extension download, AI test surface, and any ungated setup/test routes in `server/routes.ts`.
- Admin surfaces: `/api/admin/*`, `/api/debug/*`, and `/admin*` UI.
- Dev-only areas usually out of scope unless proven shipped: local SQL helper files and docs. `server/routes.ts` is not dev-only.

## Threat Categories

### Spoofing

The application relies on Supabase bearer tokens for authenticated API access and admin verification. Protected server routes must reject missing, invalid, or expired tokens, and no alternate login or extension flow may weaken the guarantees provided by standard Supabase auth.

### Tampering

Because the server has service-role access, any route that accepts untrusted input and performs privileged database or auth operations can let an attacker create users, change data across tenants, or alter application state outside RLS. Server-side setup, demo, and admin endpoints must be explicitly authorized before they call privileged Supabase APIs.

### Information Disclosure

Tenant data is primarily protected by Supabase RLS plus server-side scoping in Express. The system must ensure that debug/admin responses, profile queries, and server logs do not expose other users' data, auth artifacts, or contact details beyond the intended audience.

### Denial of Service

AI, SMS, checkout, and auth endpoints can trigger costly external calls or repeated expensive operations. Public or weakly gated routes must not allow arbitrary callers to consume Anthropic, Twilio, Stripe, or privileged Supabase capacity at operator expense.

### Elevation of Privilege

The highest-risk failure mode is any path from an unauthenticated or ordinary user request to service-role actions such as creating users, promoting/administering accounts, revoking sessions, or executing SQL. Admin UI checks are insufficient on their own; the backend and database policies must independently enforce role boundaries.