# Roadmap

## Done (v0.1)
- Public site: home, mentor directory (filters in URL), mentor profile with plans, how-it-works, pricing/teams, become-a-mentor
- Auth: sign up (mentee / mentor intent), sign in, reset password; multi-role workspace switcher
- Mentee: journey stepper, assessment wizard, plan board, tasks & submissions, sessions, chat, applications, reviews, payments
- Mentor: applications accept/decline, mentees, plan builder, review queue, sessions, profile/plans editor, earnings chart
- Supervisor: transparent risk scoring, notes (private / staff / mentee), interventions
- Admin: KPIs, roles, mentor approvals, supervisor assignment, taxonomy, manual payment confirmation/refund, settings, audit log
- Supabase schema with RLS, RPCs, triggers, realtime; automated DB security tests; GitHub Pages CI/CD

## Next
1. File uploads for task submissions (private Storage bucket + policies)
2. Mentor availability slots & self-booking by mentees (with time-zone aware calendar)
3. Final review module (closing assessment, self-review, summary) + certificate
4. Email notifications (Supabase Edge Function + provider)
5. Payment provider (hosted checkout + signed webhook Edge Function) — choose provider for target markets
6. Zoom / Google Meet integration behind `MeetingProvider` (manual links stay as fallback)
7. Organizations / Team Hub: cohorts, program managers, team reports
8. Reports export (CSV/PDF), admin analytics over time
9. Udemy Business connector (after verifying API access & licensing)
