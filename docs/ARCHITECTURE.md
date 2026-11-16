# Architecture

Single React SPA (Vite) for **all roles** + Supabase (Postgres, Auth, Realtime, Storage). No custom backend server.
Same stack and conventions as the LLC reference project (React 19, Vite 8, TypeScript, Tailwind 4, React Router 7, Zustand 5, supabase-js, lucide-react, animate.css), deployed to GitHub Pages.

```
Browser (React SPA on GitHub Pages)
  │  supabase-js with the public anon key
  ▼
Supabase ── Auth (email/password, reset)
        ├── Postgres  ← Row Level Security on every table = the real access control
        │              ← SECURITY DEFINER RPCs for state transitions (decide_request, set_plan_status, …)
        │              ← triggers: notifications, audit log, counters, guards
        ├── Realtime  (messages, notifications)
        └── Storage   (avatars bucket)
```

## Folders
| Path | Purpose |
|---|---|
| `src/lib/api.ts` | The only place that talks to Supabase. Every function has a *demo* branch (in-memory sample data) and a *live* branch. |
| `src/lib/demo.ts` | Sample data for preview mode / when Supabase is not configured. Never written to the DB. |
| `src/lib/auth.ts` | Session store (Zustand): user, roles (from `user_roles`), active workspace, demo sign-in. |
| `src/lib/i18n.ts` | Arabic/English (RTL/LTR) — inline bilingual strings `t('English', 'عربي')`. |
| `src/lib/nav.ts` | Sidebar menus and home route per role. |
| `src/components/` | UI kit (`ui.tsx`), brand/media, layout (sidebar, top bar), mentor card, development-plan board. |
| `src/pages/public` | Marketing site, mentor directory & profiles, auth. |
| `src/pages/{mentee,mentor,supervisor,admin,shared}` | Role workspaces (one app, one router). |
| `supabase/migrations` | Schema, RLS, functions, triggers. |
| `supabase/tests` | Stub of Supabase auth + end-to-end RLS/workflow tests (`scripts/test-db.sh`). |

## Roles
`mentee`, `mentor`, `supervisor`, `program_manager`, `admin`, `support` (multi-role users get a workspace switcher).
Route guards are UX only — RLS decides what data each user can read or write.

## Key workflows (DB-enforced)
* Request: `submitted → under_review → accepted | rejected | cancelled` (one open request per pair).
* Mentorship: `pending_setup → active → paused → completed | cancelled`.
* Plan: `draft → pending_approval → active → on_hold/completed` — mentor proposes, mentee approves; edits are versioned.
* Task: mentee `not_started → in_progress → submitted`; mentor `approved → completed` or `changes_requested`.
* Payments: orders created on acceptance with commission snapshot; only admins / a verified webhook may change status.

## Design tokens
`src/index.css` → `@theme`: `indigo-*` = brand blue, `orange-*` = brand gold, `navy` = sidebar/dark sections (values copied from LLC).
Fonts: Poppins + Montserrat (as LLC) + Tajawal for Arabic.
