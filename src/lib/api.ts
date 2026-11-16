/**
 * Data access layer. Every function has two branches:
 *  - demo  → reads/mutates the in-memory sample data (src/lib/demo.ts)
 *  - live  → Supabase (Postgres + RLS enforces who can read/write what)
 * Screens never call supabase directly, so the UI is identical in both modes.
 */
import * as demo from './demo';
import { isDemo, me } from './auth';
import { supabase } from './supabase';
import type {
  Assessment, AuditLog, Category, Feedback, Goal, Intervention, Mentor, Mentorship, MentorshipRequest, Message, Milestone,
  Notification, Order, Package, Plan, Question, Resource, Review, Role, Session, Skill, Submission, SupervisionNote, Task, TaskStatus, UserRow,
} from './types';

type R<T> = { data: T | null; error: { message: string } | null };
function ok<T>(r: R<T>): T { if (r.error) throw new Error(r.error.message); return r.data as T; }
const uid = () => me()?.id ?? '';
const nowIso = () => new Date().toISOString();
const sleep = (ms = 180) => new Promise((r) => setTimeout(r, ms));
const MENTOR_COLS = '*';

// --------------------------------------------------------------------------------------------
// Public marketplace
// --------------------------------------------------------------------------------------------
export async function listCategories(): Promise<Category[]> {
  if (isDemo()) return demo.categories;
  return ok(await supabase.from('categories').select('*').order('sort'));
}
export async function listSkills(): Promise<Skill[]> {
  if (isDemo()) return demo.skills;
  return ok(await supabase.from('skills').select('*').order('name'));
}

export type MentorFilters = { q?: string; category?: string; skill?: string; lang?: string; maxPrice?: number; sort?: string; available?: boolean };
export const minPrice = (m: Mentor) => Math.min(...m.packages.filter((p) => p.is_active && p.billing === 'monthly').map((p) => Number(p.price)), Infinity);

export function filterMentors(list: Mentor[], f: MentorFilters) {
  const q = f.q?.trim().toLowerCase();
  let out = list.filter((m) =>
    (!q || [m.full_name, m.headline, m.job_title, m.company, ...m.skills, ...m.categories.flatMap((c) => [c.name_en, c.name_ar])].join(' ').toLowerCase().includes(q)) &&
    (!f.category || m.categories.some((c) => c.slug === f.category)) &&
    (!f.skill || m.skills.includes(f.skill)) &&
    (!f.lang || m.languages.includes(f.lang)) &&
    (!f.maxPrice || minPrice(m) <= f.maxPrice) &&
    (!f.available || (m.accepting && m.spots_left > 0)));
  const s = f.sort ?? 'recommended';
  out = [...out].sort((a, b) =>
    s === 'rating' ? b.rating_avg - a.rating_avg :
    s === 'price_asc' ? minPrice(a) - minPrice(b) :
    s === 'price_desc' ? minPrice(b) - minPrice(a) :
    s === 'reviews' ? b.reviews_count - a.reviews_count :
    Number(b.featured) - Number(a.featured) || b.rating_avg * Math.log(b.reviews_count + 2) - a.rating_avg * Math.log(a.reviews_count + 2));
  return out;
}

export async function listMentors(): Promise<Mentor[]> {
  if (isDemo()) { await sleep(); return demo.mentors; }
  return ok(await supabase.from('mentor_directory').select(MENTOR_COLS).limit(500)) as Mentor[];
}
export async function getMentor(slug: string): Promise<Mentor | null> {
  if (isDemo()) { await sleep(); return demo.mentors.find((m) => m.slug === slug) ?? demo.pendingMentors.find((m) => m.slug === slug) ?? null; }
  return ok(await supabase.from('mentor_directory').select(MENTOR_COLS).eq('slug', slug).maybeSingle()) as Mentor | null;
}
export async function mentorReviews(mentorId: string): Promise<Review[]> {
  if (isDemo()) return demo.reviews.slice(0, 4).map((r) => ({ ...r, mentor_id: mentorId }));
  return ok(await supabase.from('public_reviews').select('*').eq('mentor_id', mentorId).order('created_at', { ascending: false }).limit(20));
}
export async function publicReviews(): Promise<Review[]> {
  if (isDemo()) return demo.reviews;
  return ok(await supabase.from('public_reviews').select('*').order('created_at', { ascending: false }).limit(6));
}

// --------------------------------------------------------------------------------------------
// Requests (applications) & mentorships
// --------------------------------------------------------------------------------------------
const REQ_SELECT = '*, mentee:profiles!mentorship_requests_mentee_id_fkey(full_name,headline,country), mentor:mentor_profiles!mentorship_requests_mentor_id_fkey(full_name,slug,headline), package:mentorship_packages(name,price,currency)';

export async function myRequests(): Promise<MentorshipRequest[]> {
  if (isDemo()) return demo.requests.filter((r) => r.mentee_id === uid());
  return ok(await supabase.from('mentorship_requests').select(REQ_SELECT).eq('mentee_id', uid()).order('created_at', { ascending: false }));
}
export async function incomingRequests(): Promise<MentorshipRequest[]> {
  if (isDemo()) return demo.requests.filter((r) => r.mentor_id === uid());
  return ok(await supabase.from('mentorship_requests').select(REQ_SELECT).eq('mentor_id', uid()).order('created_at', { ascending: false }));
}
export async function createRequest(p: { mentor_id: string; package_id: number | null; goal: string; background: string; expectations: string }) {
  if (isDemo()) {
    if (demo.requests.some((r) => r.mentee_id === uid() && r.mentor_id === p.mentor_id && ['submitted', 'under_review'].includes(r.status))) throw new Error('You already have an open application with this mentor.');
    const m = demo.mentors.find((x) => x.id === p.mentor_id)!;
    const pkg = m.packages.find((x) => x.id === p.package_id);
    demo.requests.unshift({ id: demo.nextId(), mentee_id: uid(), status: 'submitted', decision_note: null, created_at: nowIso(), decided_at: null, ...p, mentee: { full_name: me()!.name, headline: null, country: null }, mentor: { full_name: m.full_name, slug: m.slug, headline: m.headline }, package: pkg ? { name: pkg.name, price: pkg.price, currency: pkg.currency } : null });
    return;
  }
  ok(await supabase.from('mentorship_requests').insert({ ...p, mentee_id: uid() }));
}
export async function cancelRequest(id: number) {
  if (isDemo()) { const r = demo.requests.find((x) => x.id === id); if (r) r.status = 'cancelled'; return; }
  ok(await supabase.from('mentorship_requests').update({ status: 'cancelled' }).eq('id', id));
}
/** Accept → creates the mentorship (+ pending order) atomically in Postgres (RPC `decide_request`). */
export async function decideRequest(id: number, accept: boolean, note: string) {
  if (isDemo()) {
    const r = demo.requests.find((x) => x.id === id)!;
    r.status = accept ? 'accepted' : 'rejected'; r.decision_note = note || null; r.decided_at = nowIso();
    if (accept) demo.mentorships.unshift({ id: demo.nextId(), mentee_id: r.mentee_id, mentor_id: r.mentor_id, supervisor_id: null, package_id: r.package_id, status: 'pending_setup', started_at: nowIso(), ended_at: null, last_activity_at: nowIso(), mentee: { full_name: r.mentee?.full_name ?? '', headline: r.mentee?.headline ?? null, avatar_url: null }, mentor: { full_name: me()!.name, headline: null, avatar_url: null }, supervisor: null, package: { name: r.package?.name ?? '' } });
    return;
  }
  ok(await supabase.rpc('decide_request', { p_request_id: id, p_accept: accept, p_note: note || null }));
}
export async function markUnderReview(id: number) {
  if (isDemo()) { const r = demo.requests.find((x) => x.id === id); if (r && r.status === 'submitted') r.status = 'under_review'; return; }
  await supabase.from('mentorship_requests').update({ status: 'under_review' }).eq('id', id).eq('status', 'submitted');
}

const MS_SELECT = '*, mentee:profiles!mentorships_mentee_id_fkey(full_name,headline,avatar_url), mentor:profiles!mentorships_mentor_id_fkey(full_name,headline,avatar_url), supervisor:profiles!mentorships_supervisor_id_fkey(full_name), package:mentorship_packages(name)';
export async function mentorshipsAs(role: Role): Promise<Mentorship[]> {
  const col = role === 'mentor' ? 'mentor_id' : role === 'mentee' ? 'mentee_id' : role === 'supervisor' || role === 'program_manager' ? 'supervisor_id' : null;
  if (isDemo()) {
    if (!col) return demo.mentorships;
    // demo supervisor/admin see the seeded supervisor's caseload
    const id = col === 'supervisor_id' ? 'demo-supervisor' : uid();
    return demo.mentorships.filter((m) => m[col as 'mentor_id'] === id);
  }
  let q = supabase.from('mentorships').select(MS_SELECT).order('started_at', { ascending: false });
  if (col) q = q.eq(col, uid());
  return ok(await q);
}
export async function getMentorship(id: number): Promise<Mentorship | null> {
  if (isDemo()) return demo.mentorships.find((m) => m.id === id) ?? null;
  return ok(await supabase.from('mentorships').select(MS_SELECT).eq('id', id).maybeSingle());
}
export async function setMentorshipStatus(id: number, status: Mentorship['status']) {
  if (isDemo()) { const m = demo.mentorships.find((x) => x.id === id); if (m) m.status = status; return; }
  ok(await supabase.from('mentorships').update({ status }).eq('id', id));
}
export async function assignSupervisor(id: number, supervisorId: string | null) {
  if (isDemo()) { const m = demo.mentorships.find((x) => x.id === id); if (m) { m.supervisor_id = supervisorId; m.supervisor = supervisorId ? { full_name: demo.users.find((u) => u.id === supervisorId)?.full_name ?? '' } : null; } return; }
  ok(await supabase.from('mentorships').update({ supervisor_id: supervisorId }).eq('id', id));
}

// --------------------------------------------------------------------------------------------
// Assessment
// --------------------------------------------------------------------------------------------
export async function assessmentQuestions(): Promise<Question[]> {
  if (isDemo()) return demo.questions;
  const tpl = ok(await supabase.from('assessment_templates').select('id').eq('is_active', true).eq('kind', 'initial').order('id').limit(1).maybeSingle()) as { id: number } | null;
  if (!tpl) return [];
  return ok(await supabase.from('assessment_questions').select('*').eq('template_id', tpl.id).order('sort'));
}
export async function myAssessment(menteeId = uid()): Promise<Assessment | null> {
  if (isDemo()) return demo.assessments.find((a) => a.mentee_id === menteeId && a.kind === 'initial') ?? null;
  return ok(await supabase.from('assessment_submissions').select('*').eq('mentee_id', menteeId).eq('kind', 'initial').order('id', { ascending: false }).limit(1).maybeSingle());
}
export async function saveAssessment(answers: Record<string, unknown>, submit: boolean, templateId: number) {
  const status = submit ? 'submitted' : 'draft';
  if (isDemo()) {
    const a = demo.assessments.find((x) => x.mentee_id === uid() && x.kind === 'initial');
    if (a) Object.assign(a, { answers, status, submitted_at: submit ? nowIso() : a.submitted_at });
    else demo.assessments.push({ id: demo.nextId(), mentee_id: uid(), template_id: templateId, kind: 'initial', answers, status, submitted_at: submit ? nowIso() : null, review_note: null });
    return;
  }
  const existing = await myAssessment();
  if (existing) ok(await supabase.from('assessment_submissions').update({ answers, status, submitted_at: submit ? nowIso() : existing.submitted_at }).eq('id', existing.id));
  else ok(await supabase.from('assessment_submissions').insert({ mentee_id: uid(), template_id: templateId, kind: 'initial', answers, status, submitted_at: submit ? nowIso() : null }));
}
export async function reviewAssessment(id: number, status: 'reviewed' | 'needs_info', note: string) {
  if (isDemo()) { const a = demo.assessments.find((x) => x.id === id); if (a) Object.assign(a, { status, review_note: note }); return; }
  ok(await supabase.from('assessment_submissions').update({ status, review_note: note }).eq('id', id));
}

// --------------------------------------------------------------------------------------------
// Development plan, goals, milestones, tasks, resources
// --------------------------------------------------------------------------------------------
export type PlanBundle = { plan: Plan | null; goals: Goal[]; milestones: Milestone[]; tasks: Task[]; resources: Resource[] };

export async function planForMentorship(mentorshipId: number): Promise<PlanBundle> {
  if (isDemo()) {
    const plan = demo.plans.find((p) => p.mentorship_id === mentorshipId) ?? null;
    const by = <T extends { plan_id: number }>(a: T[]) => (plan ? a.filter((x) => x.plan_id === plan.id) : []);
    return { plan, goals: by(demo.goals).sort((a, b) => a.sort - b.sort), milestones: by(demo.milestones), tasks: by(demo.tasks), resources: by(demo.resources) };
  }
  const plan = ok(await supabase.from('development_plans').select('*').eq('mentorship_id', mentorshipId).neq('status', 'cancelled').order('id', { ascending: false }).limit(1).maybeSingle()) as Plan | null;
  if (!plan) return { plan: null, goals: [], milestones: [], tasks: [], resources: [] };
  const [g, m, t, r] = await Promise.all([
    supabase.from('plan_goals').select('*').eq('plan_id', plan.id).order('sort'),
    supabase.from('plan_milestones').select('*').eq('plan_id', plan.id).order('due_date'),
    supabase.from('plan_tasks').select('*').eq('plan_id', plan.id).order('due_date'),
    supabase.from('learning_resources').select('*').eq('plan_id', plan.id).order('id'),
  ]);
  return { plan, goals: ok(g), milestones: ok(m), tasks: ok(t), resources: ok(r) };
}
/** The mentee's current mentorship (active first). */
export async function currentMentorship(): Promise<Mentorship | null> {
  const list = await mentorshipsAs('mentee');
  const rank = { active: 0, pending_setup: 1, paused: 2, completed: 3, cancelled: 4 } as const;
  return [...list].sort((a, b) => rank[a.status] - rank[b.status])[0] ?? null;
}

export async function savePlan(p: Partial<Plan> & { mentorship_id: number }) {
  if (isDemo()) {
    const ms = demo.mentorships.find((m) => m.id === p.mentorship_id)!;
    let plan = p.id ? demo.plans.find((x) => x.id === p.id) : undefined;
    if (plan) Object.assign(plan, p, { version: plan.version + 1 });
    else { plan = { id: demo.nextId(), mentee_id: ms.mentee_id, mentor_id: ms.mentor_id, title: '', summary: null, status: 'draft', start_date: null, target_date: null, approved_at: null, version: 1, created_at: nowIso(), ...p }; demo.plans.push(plan); }
    return plan;
  }
  if (p.id) { const { id, ...rest } = p; return ok(await supabase.from('development_plans').update(rest).eq('id', id).select().single()) as Plan; }
  return ok(await supabase.from('development_plans').insert(p).select().single()) as Plan;
}
export async function setPlanStatus(id: number, status: Plan['status']) {
  if (isDemo()) { const p = demo.plans.find((x) => x.id === id); if (p) { p.status = status; if (status === 'active') p.approved_at = nowIso(); } return; }
  ok(await supabase.rpc('set_plan_status', { p_plan_id: id, p_status: status }));
}

function upsertDemo<T extends { id: number }>(arr: T[], row: Partial<T>, defaults: Omit<T, 'id'>): T {
  if (row.id) { const x = arr.find((r) => r.id === row.id)!; Object.assign(x, row); return x; }
  const n = { ...defaults, ...row, id: demo.nextId() } as T; arr.push(n); return n;
}
async function upsertLive<T>(table: string, row: Partial<T> & { id?: number }) {
  const { id, ...rest } = row as Record<string, unknown> & { id?: number };
  if (id) return ok(await supabase.from(table).update(rest).eq('id', id).select().single()) as T;
  return ok(await supabase.from(table).insert(rest).select().single()) as T;
}
async function removeRow(table: string, arr: { id: number }[], id: number) {
  if (isDemo()) { const i = arr.findIndex((x) => x.id === id); if (i >= 0) arr.splice(i, 1); return; }
  ok(await supabase.from(table).delete().eq('id', id));
}

export const saveGoal = (g: Partial<Goal> & { plan_id: number }) => isDemo()
  ? Promise.resolve(upsertDemo(demo.goals, g, { plan_id: g.plan_id, title: '', description: null, rationale: null, baseline: null, target: null, success_criteria: null, priority: 'medium', status: 'not_started', due_date: null, sort: 99 }))
  : upsertLive<Goal>('plan_goals', g);
export const deleteGoal = (id: number) => removeRow('plan_goals', demo.goals, id);

export const saveMilestone = (m: Partial<Milestone> & { plan_id: number }) => isDemo()
  ? Promise.resolve(upsertDemo(demo.milestones, m, { plan_id: m.plan_id, goal_id: null, title: '', due_date: null, done: false }))
  : upsertLive<Milestone>('plan_milestones', m);
export const deleteMilestone = (id: number) => removeRow('plan_milestones', demo.milestones, id);

export const saveTask = (t: Partial<Task> & { plan_id: number }) => isDemo()
  ? Promise.resolve(upsertDemo(demo.tasks, { ...t, updated_at: nowIso() }, { plan_id: t.plan_id, goal_id: null, title: '', description: null, kind: 'exercise', status: 'not_started', due_date: null, resource_url: null, created_at: nowIso(), updated_at: nowIso() }))
  : upsertLive<Task>('plan_tasks', t);
export const deleteTask = (id: number) => removeRow('plan_tasks', demo.tasks, id);

export const saveResource = (r: Partial<Resource> & { plan_id: number }) => isDemo()
  ? Promise.resolve(upsertDemo(demo.resources, r, { plan_id: r.plan_id, goal_id: null, title: '', url: '', kind: 'article', provider: null, done: false }))
  : upsertLive<Resource>('learning_resources', r);
export const deleteResource = (id: number) => removeRow('learning_resources', demo.resources, id);

/** Status changes go through an RPC so the database decides which transitions each role may make. */
export async function setTaskStatus(id: number, status: TaskStatus) {
  if (isDemo()) { const t = demo.tasks.find((x) => x.id === id); if (t) { t.status = status; t.updated_at = nowIso(); } return; }
  ok(await supabase.rpc('set_task_status', { p_task_id: id, p_status: status }));
}
export async function taskThread(taskId: number): Promise<{ submissions: Submission[]; feedback: Feedback[] }> {
  if (isDemo()) return { submissions: demo.submissions.filter((s) => s.task_id === taskId), feedback: demo.feedback.filter((f) => f.task_id === taskId) };
  const [s, f] = await Promise.all([
    supabase.from('task_submissions').select('*, author:profiles(full_name)').eq('task_id', taskId).order('created_at'),
    supabase.from('task_feedback').select('*, author:profiles(full_name)').eq('task_id', taskId).order('created_at'),
  ]);
  return { submissions: ok(s), feedback: ok(f) };
}
export async function submitTask(taskId: number, body: string, link: string) {
  if (isDemo()) {
    demo.submissions.push({ id: demo.nextId(), task_id: taskId, author_id: uid(), body, link_url: link || null, created_at: nowIso(), author: { full_name: me()!.name } });
    return setTaskStatus(taskId, 'submitted');
  }
  ok(await supabase.from('task_submissions').insert({ task_id: taskId, author_id: uid(), body, link_url: link || null }));
}
export async function giveFeedback(taskId: number, body: string, decision: Feedback['decision']) {
  if (isDemo()) {
    demo.feedback.push({ id: demo.nextId(), task_id: taskId, author_id: uid(), body, decision, created_at: nowIso(), author: { full_name: me()!.name } });
    if (decision !== 'comment') await setTaskStatus(taskId, decision === 'approved' ? 'completed' : 'changes_requested');
    return;
  }
  ok(await supabase.from('task_feedback').insert({ task_id: taskId, author_id: uid(), body, decision }));
}
/** Tasks waiting for the mentor's review across all mentees. */
export async function submittedTasks(): Promise<(Task & { mentee_name: string; mentorship_id: number })[]> {
  if (isDemo()) {
    return demo.tasks.filter((t) => t.status === 'submitted').flatMap((t) => {
      const p = demo.plans.find((x) => x.id === t.plan_id)!;
      if (p.mentor_id !== uid() && !me()?.roles.includes('admin')) return [];
      return [{ ...t, mentorship_id: p.mentorship_id, mentee_name: demo.users.find((u) => u.id === p.mentee_id)?.full_name ?? '' }];
    });
  }
  const rows = ok(await supabase.from('plan_tasks').select('*, plan:development_plans!inner(mentor_id, mentorship_id, mentee:profiles!development_plans_mentee_id_fkey(full_name))').eq('status', 'submitted').eq('plan.mentor_id', uid())) as (Task & { plan: { mentorship_id: number; mentee: { full_name: string } } })[];
  return rows.map((r) => ({ ...r, mentorship_id: r.plan.mentorship_id, mentee_name: r.plan.mentee?.full_name ?? '' }));
}
/** All tasks of the signed-in mentee (all plans). */
export async function myTasks(): Promise<Task[]> {
  if (isDemo()) { const ids = demo.plans.filter((p) => p.mentee_id === uid()).map((p) => p.id); return demo.tasks.filter((t) => ids.includes(t.plan_id)); }
  return ok(await supabase.from('plan_tasks').select('*, plan:development_plans!inner(mentee_id)').eq('plan.mentee_id', uid()).order('due_date'));
}

// --------------------------------------------------------------------------------------------
// Sessions
// --------------------------------------------------------------------------------------------
const SES_SELECT = '*, mentee:profiles!sessions_mentee_id_fkey(full_name), mentor:profiles!sessions_mentor_id_fkey(full_name)';
export async function listSessions(scope: { mentorshipId?: number; role?: Role } = {}): Promise<Session[]> {
  if (isDemo()) {
    const r = scope.role;
    return demo.sessions.filter((s) => (scope.mentorshipId ? s.mentorship_id === scope.mentorshipId : r === 'mentor' ? s.mentor_id === uid() : r === 'mentee' ? s.mentee_id === uid() : true))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }
  let q = supabase.from('sessions').select(SES_SELECT).order('starts_at');
  if (scope.mentorshipId) q = q.eq('mentorship_id', scope.mentorshipId);
  else if (scope.role === 'mentor') q = q.eq('mentor_id', uid());
  else if (scope.role === 'mentee') q = q.eq('mentee_id', uid());
  return ok(await q);
}
export async function saveSession(s: Partial<Session> & { mentorship_id: number }) {
  if (isDemo()) {
    const ms = demo.mentorships.find((m) => m.id === s.mentorship_id)!;
    return upsertDemo(demo.sessions, s, { mentorship_id: s.mentorship_id, mentee_id: ms.mentee_id, mentor_id: ms.mentor_id, goal_id: null, title: '', starts_at: nowIso(), duration_min: 45, timezone: 'UTC', status: 'scheduled', meeting_url: null, agenda: null, shared_notes: null, created_at: nowIso(), mentee: { full_name: ms.mentee?.full_name ?? '' }, mentor: { full_name: ms.mentor?.full_name ?? '' } });
  }
  const { mentee: _a, mentor: _b, ...row } = s as Session; void _a; void _b;
  return upsertLive<Session>('sessions', row);
}

// --------------------------------------------------------------------------------------------
// Messages (Realtime in live mode)
// --------------------------------------------------------------------------------------------
export async function listMessages(mentorshipId: number): Promise<Message[]> {
  if (isDemo()) return demo.messages.filter((m) => m.mentorship_id === mentorshipId);
  return ok(await supabase.from('messages').select('*').eq('mentorship_id', mentorshipId).order('created_at').limit(500));
}
export async function sendMessage(mentorshipId: number, body: string) {
  if (isDemo()) { const m = { id: demo.nextId(), mentorship_id: mentorshipId, sender_id: uid(), body, created_at: nowIso(), read_at: null }; demo.messages.push(m); return m; }
  return ok(await supabase.from('messages').insert({ mentorship_id: mentorshipId, sender_id: uid(), body }).select().single()) as Message;
}
export function subscribeMessages(mentorshipId: number, onInsert: (m: Message) => void) {
  if (isDemo()) return () => {};
  const ch = supabase.channel(`msg-${mentorshipId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `mentorship_id=eq.${mentorshipId}` }, (p) => onInsert(p.new as Message))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}
export async function markMessagesRead(mentorshipId: number) {
  if (isDemo()) { demo.messages.forEach((m) => { if (m.mentorship_id === mentorshipId && m.sender_id !== uid()) m.read_at ??= nowIso(); }); return; }
  await supabase.from('messages').update({ read_at: nowIso() }).eq('mentorship_id', mentorshipId).neq('sender_id', uid()).is('read_at', null);
}

// --------------------------------------------------------------------------------------------
// Supervision
// --------------------------------------------------------------------------------------------
export async function listNotes(mentorshipId: number): Promise<SupervisionNote[]> {
  if (isDemo()) return demo.notes.filter((n) => n.mentorship_id === mentorshipId);
  return ok(await supabase.from('supervision_notes').select('*, author:profiles(full_name)').eq('mentorship_id', mentorshipId).order('created_at', { ascending: false }));
}
export async function addNote(mentorshipId: number, body: string, visibility: SupervisionNote['visibility']) {
  if (isDemo()) { demo.notes.unshift({ id: demo.nextId(), mentorship_id: mentorshipId, author_id: uid(), body, visibility, created_at: nowIso(), author: { full_name: me()!.name } }); return; }
  ok(await supabase.from('supervision_notes').insert({ mentorship_id: mentorshipId, author_id: uid(), body, visibility }));
}
export async function listInterventions(mentorshipId?: number): Promise<Intervention[]> {
  if (isDemo()) return demo.interventions.filter((i) => !mentorshipId || i.mentorship_id === mentorshipId);
  let q = supabase.from('interventions').select('*').order('created_at', { ascending: false });
  if (mentorshipId) q = q.eq('mentorship_id', mentorshipId);
  return ok(await q);
}
export async function addIntervention(mentorshipId: number, kind: Intervention['kind'], note: string) {
  if (isDemo()) { demo.interventions.unshift({ id: demo.nextId(), mentorship_id: mentorshipId, author_id: uid(), kind, note, status: 'open', created_at: nowIso() }); return; }
  ok(await supabase.from('interventions').insert({ mentorship_id: mentorshipId, author_id: uid(), kind, note }));
}
export async function resolveIntervention(id: number) {
  if (isDemo()) { const i = demo.interventions.find((x) => x.id === id); if (i) i.status = 'resolved'; return; }
  ok(await supabase.from('interventions').update({ status: 'resolved' }).eq('id', id));
}

// --------------------------------------------------------------------------------------------
// Reviews & payments
// --------------------------------------------------------------------------------------------
export async function leaveReview(mentorshipId: number, mentorId: string, rating: number, comment: string) {
  if (isDemo()) { demo.reviews.unshift({ id: demo.nextId(), mentorship_id: mentorshipId, mentee_id: uid(), mentor_id: mentorId, rating, comment, is_public: true, created_at: nowIso(), mentee: { full_name: me()!.name, headline: null } }); return; }
  ok(await supabase.from('reviews').insert({ mentorship_id: mentorshipId, mentee_id: uid(), mentor_id: mentorId, rating, comment }));
}
const ORD_SELECT = '*, mentee:profiles!orders_mentee_id_fkey(full_name), mentor:profiles!orders_mentor_id_fkey(full_name), package:mentorship_packages(name)';
export async function listOrders(scope: 'mentee' | 'mentor' | 'all'): Promise<Order[]> {
  if (isDemo()) return demo.orders.filter((o) => scope === 'all' || o[`${scope}_id`] === uid() || (scope === 'mentee' && uid() === 'demo-mentee' && o.mentee_id === 'demo-mentee'));
  let q = supabase.from('orders').select(ORD_SELECT).order('created_at', { ascending: false });
  if (scope !== 'all') q = q.eq(`${scope}_id`, uid());
  return ok(await q);
}
/** Only admins (RPC checks it) may change payment state manually — e.g. confirming a bank transfer. */
export async function setOrderStatus(id: number, status: Order['status']) {
  if (isDemo()) { const o = demo.orders.find((x) => x.id === id); if (o) o.status = status; return; }
  ok(await supabase.rpc('admin_set_order_status', { p_order_id: id, p_status: status }));
}

// --------------------------------------------------------------------------------------------
// Mentor profile (self-service)
// --------------------------------------------------------------------------------------------
export async function myMentorProfile(): Promise<Mentor | null> {
  if (isDemo()) return demo.mentors.find((m) => m.id === uid()) ?? demo.mentors[0];
  // the admin view includes categories, skills, active plans and open spots; RLS lets mentors read their own row
  return ok(await supabase.from('mentor_admin_view').select('*').eq('id', uid()).maybeSingle()) as Mentor | null;
}
export async function saveMentorProfile(m: Partial<Mentor>, categoryIds: number[], skillNames: string[]) {
  if (isDemo()) {
    const t = demo.mentors.find((x) => x.id === uid()) ?? demo.mentors[0];
    Object.assign(t, m, { categories: demo.categories.filter((c) => categoryIds.includes(c.id)), skills: skillNames });
    return;
  }
  const { categories: _c, skills: _s, packages: _p, rating_avg: _r, reviews_count: _rc, mentees_count: _mc, status: _st, featured: _f, spots_left: _sl, ...row } = m as Mentor;
  void _c; void _s; void _p; void _r; void _rc; void _mc; void _st; void _f; void _sl;
  ok(await supabase.from('mentor_profiles').upsert({ ...row, id: uid() }));
  ok(await supabase.rpc('set_mentor_tags', { p_category_ids: categoryIds, p_skills: skillNames }));
}
export async function submitMentorForReview() {
  if (isDemo()) return;
  ok(await supabase.from('mentor_profiles').update({ status: 'pending' }).eq('id', uid()));
}
export const savePackage = (p: Partial<Package>) => isDemo()
  ? Promise.resolve((() => { const m = demo.mentors.find((x) => x.id === uid()) ?? demo.mentors[0]; return upsertDemo(m.packages, p, { mentor_id: m.id, name: '', description: null, price: 0, currency: 'USD', billing: 'monthly', calls_per_month: 1, call_minutes: 45, chat_support: true, response_hours: 24, features: [], is_active: true, sort: 9, trial_days: 7 }); })())
  : upsertLive<Package>('mentorship_packages', { ...p, mentor_id: uid() });
export async function deletePackage(id: number) {
  if (isDemo()) { const m = demo.mentors.find((x) => x.id === uid()) ?? demo.mentors[0]; m.packages = m.packages.filter((p) => p.id !== id); return; }
  ok(await supabase.from('mentorship_packages').update({ is_active: false }).eq('id', id));
}

// --------------------------------------------------------------------------------------------
// Notifications
// --------------------------------------------------------------------------------------------
export async function listNotifications(): Promise<Notification[]> {
  if (isDemo()) return demo.notifications;
  return ok(await supabase.from('notifications').select('*').eq('user_id', uid()).order('created_at', { ascending: false }).limit(30));
}
export async function markNotification(id: number | 'all') {
  if (isDemo()) { demo.notifications.forEach((n) => { if (id === 'all' || n.id === id) n.read = true; }); return; }
  let q = supabase.from('notifications').update({ read: true }).eq('user_id', uid());
  if (id !== 'all') q = q.eq('id', id);
  ok(await q);
}

// --------------------------------------------------------------------------------------------
// Admin
// --------------------------------------------------------------------------------------------
export async function listUsers(): Promise<UserRow[]> {
  if (isDemo()) return demo.users;
  const [p, r] = await Promise.all([supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000), supabase.from('user_roles').select('user_id, role')]);
  const roles = ok(r) as { user_id: string; role: Role }[];
  return (ok(p) as UserRow[]).map((u) => ({ ...u, roles: roles.filter((x) => x.user_id === u.id).map((x) => x.role) }));
}
export async function setRole(userId: string, role: Role, grant: boolean) {
  if (isDemo()) { const u = demo.users.find((x) => x.id === userId)!; u.roles = grant ? [...new Set([...u.roles, role])] : u.roles.filter((r) => r !== role); return; }
  ok(await supabase.rpc('admin_set_role', { p_user_id: userId, p_role: role, p_grant: grant }));
}
export async function setUserActive(userId: string, active: boolean) {
  if (isDemo()) { const u = demo.users.find((x) => x.id === userId)!; u.is_active = active; return; }
  ok(await supabase.from('profiles').update({ is_active: active }).eq('id', userId));
}
export async function mentorApplications(): Promise<Mentor[]> {
  if (isDemo()) return [...demo.pendingMentors, ...demo.mentors];
  return ok(await supabase.from('mentor_admin_view').select('*').order('created_at', { ascending: false }));
}
export async function decideMentor(id: string, status: 'approved' | 'rejected' | 'suspended', featured?: boolean) {
  if (isDemo()) { const m = [...demo.pendingMentors, ...demo.mentors].find((x) => x.id === id)!; m.status = status; m.is_published = status === 'approved'; if (featured !== undefined) m.featured = featured; return; }
  ok(await supabase.rpc('admin_decide_mentor', { p_mentor_id: id, p_status: status, p_featured: featured ?? null }));
}
export async function saveCategory(c: Partial<Category>) {
  if (isDemo()) return upsertDemo(demo.categories, c, { slug: '', name_en: '', name_ar: '', icon: null, color: 'indigo' });
  return upsertLive<Category>('categories', c);
}
export const deleteCategory = (id: number) => removeRow('categories', demo.categories, id);
export async function saveSkill(name: string) {
  if (isDemo()) return upsertDemo(demo.skills, { name }, { name, category_id: null });
  return upsertLive<Skill>('skills', { name });
}
export const deleteSkill = (id: number) => removeRow('skills', demo.skills, id);
export async function getSettings(): Promise<Record<string, unknown>> {
  if (isDemo()) return demo.settings;
  const rows = ok(await supabase.from('system_settings').select('key, value')) as { key: string; value: unknown }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
export async function setSetting(key: string, value: unknown) {
  if (isDemo()) { demo.settings[key] = value; return; }
  ok(await supabase.from('system_settings').upsert({ key, value }));
}
export async function listAudit(): Promise<AuditLog[]> {
  if (isDemo()) return demo.auditLogs;
  return ok(await supabase.from('audit_logs').select('*, actor:profiles(full_name)').order('created_at', { ascending: false }).limit(200));
}

// --------------------------------------------------------------------------------------------
// Profile
// --------------------------------------------------------------------------------------------
export async function updateMyProfile(p: { full_name: string; headline: string; country: string; timezone: string; locale: string; bio: string; phone: string }) {
  if (isDemo()) { const u = demo.users.find((x) => x.id === uid()); if (u) Object.assign(u, p); return; }
  ok(await supabase.from('profiles').update(p).eq('id', uid()));
}
export async function myProfileRow(): Promise<UserRow | null> {
  if (isDemo()) return demo.users.find((x) => x.id === uid()) ?? { ...demo.users[0], id: uid(), full_name: me()?.name ?? '', email: me()?.email ?? '' };
  const p = ok(await supabase.from('profiles').select('*').eq('id', uid()).maybeSingle()) as UserRow | null;
  return p ? { ...p, roles: me()?.roles ?? [] } : null;
}
export async function becomeMentor() {
  if (isDemo()) return;
  ok(await supabase.rpc('apply_as_mentor'));
}
