# Murshid | مُرشد — Mentorship & career development platform

منصة إرشاد وتطوير مهني متكاملة (على غرار MentorCruise) مبنية بنفس تقنيات وتصميم منصة LLC:
اكتشاف المرشدين، التقديم والقبول، **التقييم الأولي ← خطة تطوير فردية ← مهام وتسليمات ومراجعات ← جلسات ← متابعة المشرف ← مراجعة ختامية**، مع المدفوعات والعمولات ولوحة إدارة كاملة. عربي/إنجليزي بالكامل (RTL/LTR).

## Stack
React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router 7 · Zustand · Supabase (Postgres + RLS, Auth, Realtime, Storage) · lucide-react · animate.css — hosted on GitHub Pages.

## Workspaces (one app)
| Role | What they get |
|---|---|
| Mentee | Journey dashboard, assessment wizard, development plan, tasks & submissions, sessions, chat, applications, payments |
| Mentor | Applications inbox, mentees, plan builder (goals/milestones/tasks/resources), review queue, sessions, profile & plans editor, earnings |
| Supervisor | Risk-sorted caseload (overdue / inactivity / no-shows), notes with visibility levels, interventions |
| Admin | KPIs, users & roles, mentor approvals, mentorships & supervisor assignment, categories/skills, payments & commission, settings, audit log |

## Quick start
```bash
npm install
npm run dev
```
Without Supabase keys the app runs in **preview mode** with sample data — open `/login` and choose a workspace.

**Connect Supabase:** see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) (Arabic step-by-step).

## Tests
```bash
npm run build                 # type-check + production build
./scripts/test-db.sh          # all migrations + 46 RLS / workflow / demo-account checks against a local Postgres 16
```

```bash
./scripts/journey.sh          # full mentee journey simulation: prints OK / GAP / FAIL per step
```

## Deploy
Push to `main` → GitHub Actions builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
One-time: **Settings → Pages → Source: GitHub Actions**, and add the `VITE_SUPABASE_*` repository variables.

See also: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [AGENTS.md](AGENTS.md) · [docs/ROADMAP.md](docs/ROADMAP.md) · [docs/JOURNEY_REPORT.md](docs/JOURNEY_REPORT.md) · [docs/PASSPORT_PLAN.md](docs/PASSPORT_PLAN.md)
