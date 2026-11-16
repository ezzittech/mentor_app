# AGENTS.md — rules for AI agents working on this repo

- Stack is fixed: React 19 + Vite + TypeScript + Tailwind 4 + React Router 7 + Zustand + Supabase + lucide-react. No Next.js / Laravel / Express / extra backend.
- All data access goes through `src/lib/api.ts`. Keep both branches (demo + live) working.
- Security lives in Postgres: every new table needs RLS policies + a test in `supabase/tests/rls_workflow_test.sql`. Never trust ids/roles sent by the client.
- Never put `service_role` or any secret in the frontend, `VITE_*` vars or the repo.
- Status changes with business rules go through SECURITY DEFINER RPCs that check `auth.uid()`.
- New migrations: add `supabase/migrations/000N_*.sql`; never edit an applied migration in production.
- UI: bilingual (`useT()` → `t('English','عربي')`), RTL-safe classes (`ms/me/ps/pe/start/end`, `rtl:rotate-180` for arrows). Use the components in `src/components/ui.tsx` and the colour tokens in `src/index.css`.
- Every screen needs loading / empty / error states.
- Before committing: `npm run build` and `./scripts/test-db.sh` must pass.
- Deferred until approved: real payment provider, Zoom/Meet APIs, Udemy Business API.
