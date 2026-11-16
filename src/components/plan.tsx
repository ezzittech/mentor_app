import { useState } from 'react';
import {
  BookOpen, Calendar, CheckCircle2, ChevronDown, Circle, ExternalLink, Flag, Info, Link2, ListPlus, Loader2, Milestone as MilestoneIcon,
  Pencil, Plus, Send, Target, ThumbsUp, Trash2, Undo2, Wrench,
} from 'lucide-react';
import {
  Card, Confirm, Empty, Field, Modal, Progress, Ring, StatusPill, act, btnAccent, btnGhost, btnPrimary, btnSm, inputCls, statusLabel,
} from './ui';
import { Avatar } from './media';
import * as api from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { daysUntil, fmtDate, fmtDateTime } from '../lib/format';
import { useLang, useT } from '../lib/i18n';
import type { Goal, Milestone, Plan, Resource, Task, TaskKind, TaskStatus } from '../lib/types';

export type PlanMode = 'mentee' | 'mentor' | 'viewer';

/** Progress is explicit: a goal = completed tasks ÷ active tasks (achieved goal = 100%); plan = average of goals. */
export function goalProgress(g: Goal, tasks: Task[]) {
  if (g.status === 'achieved') return 100;
  const ts = tasks.filter((t) => t.goal_id === g.id && t.status !== 'cancelled');
  return ts.length ? (ts.filter((t) => t.status === 'completed').length / ts.length) * 100 : 0;
}
export function planProgress(goals: Goal[], tasks: Task[]) {
  const gs = goals.filter((g) => g.status !== 'dropped');
  return gs.length ? gs.reduce((a, g) => a + goalProgress(g, tasks), 0) / gs.length : 0;
}
export const isOverdue = (t: Task) => !!t.due_date && !['completed', 'cancelled', 'submitted'].includes(t.status) && (daysUntil(t.due_date) ?? 1) < 0;

const KIND_ICON: Record<TaskKind, typeof Wrench> = { exercise: Wrench, project: Flag, review: Undo2, session: Calendar, resource: BookOpen };
export function useKindLabel() {
  const t = useT();
  return (k: TaskKind) => ({ exercise: t('Exercise', 'تمرين'), project: t('Project', 'مشروع'), review: t('Self-review', 'مراجعة ذاتية'), session: t('Session', 'جلسة'), resource: t('Study resource', 'دراسة مورد') })[k];
}

export function TaskRow({ task, goal, onOpen }: { task: Task; goal?: Goal; onOpen: () => void }) {
  const t = useT();
  const kind = useKindLabel();
  const I = KIND_ICON[task.kind];
  const d = daysUntil(task.due_date);
  const late = isOverdue(task);
  const done = task.status === 'completed';
  return (
    <button onClick={onOpen} className="w-full text-start flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
      <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${done ? 'bg-emerald-50 text-emerald-600' : late ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>{done ? <CheckCircle2 size={20} /> : <I size={18} />}</span>
      <span className="flex-1 min-w-0">
        <span className={`block font-bold text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-800'} group-hover:text-indigo-700`}>{task.title}</span>
        <span className="block text-xs text-slate-400 mt-0.5 truncate">{kind(task.kind)}{goal && ` · ${goal.title}`}</span>
      </span>
      {task.due_date && <span className={`hidden sm:block text-xs font-bold whitespace-nowrap ${late ? 'text-red-500' : d !== null && d <= 3 && !done ? 'text-orange-500' : 'text-slate-400'}`}>{late ? t(`${-d!}d overdue`, `متأخرة ${-d!} يوم`) : fmtDate(task.due_date)}</span>}
      <StatusPill status={task.status} />
    </button>
  );
}

// ---------------------------------------------------------------- Task detail (thread + actions)
export function TaskModal({ task, mode, onClose, onChanged }: { task: Task; mode: PlanMode; onClose: () => void; onChanged: () => void }) {
  const t = useT();
  const kind = useKindLabel();
  const thread = useAsync(() => api.taskThread(task.id), [task.id]);
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); if (await act(fn, ok)) { setBody(''); setLink(''); thread.reload(); onChanged(); } setBusy(false); };
  const items = [...(thread.data?.submissions ?? []).map((s) => ({ ...s, type: 'sub' as const })), ...(thread.data?.feedback ?? []).map((f) => ({ ...f, type: 'fb' as const }))].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const canSubmit = mode === 'mentee' && ['not_started', 'in_progress', 'changes_requested'].includes(task.status);
  const canReview = mode === 'mentor' && task.status === 'submitted';
  return (
    <Modal open onClose={onClose} title={task.title} wide>
      <div className="flex flex-wrap gap-2 items-center mb-4"><StatusPill status={task.status} /><span className="text-xs font-bold text-slate-400">{kind(task.kind)}</span>{task.due_date && <span className={`text-xs font-bold ${isOverdue(task) ? 'text-red-500' : 'text-slate-400'}`}>· {t('Due', 'الاستحقاق')} {fmtDate(task.due_date)}</span>}</div>
      {task.description && <p className="text-slate-600 leading-relaxed whitespace-pre-line">{task.description}</p>}
      {task.resource_url && <a href={task.resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-indigo-600"><ExternalLink size={14} />{t('Open resource', 'فتح المورد')}</a>}

      {mode === 'mentee' && task.status === 'not_started' && <button disabled={busy} onClick={() => run(() => api.setTaskStatus(task.id, 'in_progress'), t('Task started', 'بدأت المهمة'))} className={`${btnGhost} mt-5`}>{t('Mark as in progress', 'بدء العمل على المهمة')}</button>}

      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mt-8 mb-3">{t('Activity', 'السجل')}</h4>
      {thread.loading ? <Loader2 className="animate-spin text-slate-300" /> : !items.length ? <p className="text-sm text-slate-400">{t('No submissions yet.', 'لا توجد تسليمات بعد.')}</p> : (
        <div className="space-y-3">{items.map((i) => (
          <div key={`${i.type}-${i.id}`} className={`p-4 rounded-2xl border ${i.type === 'sub' ? 'bg-slate-50 border-slate-100' : i.decision === 'approved' ? 'bg-emerald-50 border-emerald-100' : i.decision === 'changes_requested' ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className="flex items-center gap-2 mb-1.5"><Avatar name={i.author?.full_name ?? '?'} className="w-6 h-6 text-[9px]" /><b className="text-sm text-slate-800">{i.author?.full_name}</b>
              <span className="text-[11px] text-slate-400">{i.type === 'sub' ? t('submitted', 'سلّم') : i.decision === 'approved' ? t('approved', 'اعتمد') : i.decision === 'changes_requested' ? t('requested changes', 'طلب تعديلات') : t('commented', 'علّق')} · {fmtDateTime(i.created_at)}</span></div>
            <p className="text-sm text-slate-700 whitespace-pre-line">{i.body}</p>
            {i.type === 'sub' && i.link_url && <a href={i.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-2"><Link2 size={12} />{i.link_url}</a>}
          </div>
        ))}</div>
      )}

      {(canSubmit || mode === 'mentor') && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} placeholder={canSubmit ? t('Describe what you did…', 'صف ما أنجزته…') : t('Write feedback…', 'اكتب تغذية راجعة…')} aria-label="message" />
          {canSubmit && <input value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} placeholder={t('Link to your work (optional)', 'رابط عملك (اختياري)')} dir="ltr" />}
          <div className="flex flex-wrap justify-end gap-2">
            {canSubmit && <button disabled={busy || !body.trim()} onClick={() => run(() => api.submitTask(task.id, body, link), t('Submitted for review', 'تم الإرسال للمراجعة'))} className={btnAccent}><Send size={16} className="rtl:rotate-180" />{t('Submit for review', 'إرسال للمراجعة')}</button>}
            {mode === 'mentor' && <>
              <button disabled={busy || !body.trim()} onClick={() => run(() => api.giveFeedback(task.id, body, 'comment'), t('Comment added', 'تمت إضافة التعليق'))} className={btnGhost}>{t('Comment', 'تعليق')}</button>
              {canReview && <button disabled={busy || !body.trim()} onClick={() => run(() => api.giveFeedback(task.id, body, 'changes_requested'), t('Changes requested', 'تم طلب التعديل'))} className={`${btnGhost} !text-orange-600 !border-orange-200`}><Undo2 size={16} />{t('Request changes', 'طلب تعديل')}</button>}
              {canReview && <button disabled={busy || !body.trim()} onClick={() => run(() => api.giveFeedback(task.id, body, 'approved'), t('Task approved', 'تم اعتماد المهمة'))} className={btnPrimary}><ThumbsUp size={16} />{t('Approve', 'اعتماد')}</button>}
            </>}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------- Editors (mentor)
function GoalForm({ planId, goal, onClose, onSaved }: { planId: number; goal?: Goal; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const [g, setG] = useState<Partial<Goal>>(goal ?? { priority: 'medium', status: 'not_started' });
  const set = (k: keyof Goal, v: unknown) => setG((x) => ({ ...x, [k]: v }));
  const [busy, setBusy] = useState(false);
  const STATUSES: Goal['status'][] = ['not_started', 'in_progress', 'achieved', 'partially_achieved', 'not_achieved', 'dropped'];
  const lang = useLang((s) => s.lang);
  return (
    <Modal open onClose={onClose} title={goal ? t('Edit goal', 'تعديل الهدف') : t('New goal', 'هدف جديد')} wide>
      <form className="grid sm:grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); if (await act(() => api.saveGoal({ ...g, plan_id: planId }), t('Goal saved', 'تم حفظ الهدف'))) { onSaved(); onClose(); } setBusy(false); }}>
        <Field label={t('Title *', 'العنوان *')} className="sm:col-span-2"><input required value={g.title ?? ''} onChange={(e) => set('title', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Description', 'الوصف')} className="sm:col-span-2"><textarea rows={2} value={g.description ?? ''} onChange={(e) => set('description', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Why it matters (linked need)', 'سبب الارتباط باحتياج المتدرب')} className="sm:col-span-2"><input value={g.rationale ?? ''} onChange={(e) => set('rationale', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Starting point', 'مستوى البداية')}><input value={g.baseline ?? ''} onChange={(e) => set('baseline', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Target result', 'النتيجة المستهدفة')}><input value={g.target ?? ''} onChange={(e) => set('target', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Success criteria / evidence', 'معيار النجاح / دليل الإنجاز')} className="sm:col-span-2"><input value={g.success_criteria ?? ''} onChange={(e) => set('success_criteria', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Target date', 'التاريخ المستهدف')}><input type="date" value={g.due_date ?? ''} onChange={(e) => set('due_date', e.target.value || null)} className={inputCls} /></Field>
        <Field label={t('Priority', 'الأولوية')}><select value={g.priority} onChange={(e) => set('priority', e.target.value)} className={inputCls}>{(['high', 'medium', 'low'] as const).map((p) => <option key={p} value={p}>{statusLabel(p, lang)}</option>)}</select></Field>
        {goal && <Field label={t('Status', 'الحالة')}><select value={g.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, lang)}</option>)}</select></Field>}
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnPrimary}>{busy && <Loader2 size={16} className="animate-spin" />}{t('Save', 'حفظ')}</button></div>
      </form>
    </Modal>
  );
}

function TaskForm({ planId, goals, task, defaultGoal, onClose, onSaved }: { planId: number; goals: Goal[]; task?: Task; defaultGoal?: number; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const kind = useKindLabel();
  const lang = useLang((s) => s.lang);
  const [x, setX] = useState<Partial<Task>>(task ?? { kind: 'exercise', goal_id: defaultGoal ?? goals[0]?.id ?? null, status: 'not_started' });
  const set = (k: keyof Task, v: unknown) => setX((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'submitted', 'changes_requested', 'completed', 'cancelled'];
  return (
    <Modal open onClose={onClose} title={task ? t('Edit task', 'تعديل المهمة') : t('New task', 'مهمة جديدة')} wide>
      <form className="grid sm:grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const { status, ...rest } = x; const row = task ? { ...rest, status } : rest; if (await act(() => api.saveTask({ ...row, plan_id: planId }), t('Task saved', 'تم حفظ المهمة'))) { onSaved(); onClose(); } setBusy(false); }}>
        <Field label={t('Title *', 'العنوان *')} className="sm:col-span-2"><input required value={x.title ?? ''} onChange={(e) => set('title', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Instructions', 'التعليمات')} className="sm:col-span-2"><textarea rows={3} value={x.description ?? ''} onChange={(e) => set('description', e.target.value)} className={inputCls} /></Field>
        <Field label={t('Goal', 'الهدف')}><select value={x.goal_id ?? ''} onChange={(e) => set('goal_id', e.target.value ? Number(e.target.value) : null)} className={inputCls}><option value="">—</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></Field>
        <Field label={t('Type', 'النوع')}><select value={x.kind} onChange={(e) => set('kind', e.target.value)} className={inputCls}>{(['exercise', 'project', 'review', 'session', 'resource'] as TaskKind[]).map((k) => <option key={k} value={k}>{kind(k)}</option>)}</select></Field>
        <Field label={t('Due date', 'تاريخ الاستحقاق')}><input type="date" value={x.due_date ?? ''} onChange={(e) => set('due_date', e.target.value || null)} className={inputCls} /></Field>
        <Field label={t('Resource link', 'رابط المورد')}><input value={x.resource_url ?? ''} onChange={(e) => set('resource_url', e.target.value || null)} className={inputCls} dir="ltr" /></Field>
        {task && <Field label={t('Status', 'الحالة')}><select value={x.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, lang)}</option>)}</select></Field>}
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnPrimary}>{busy && <Loader2 size={16} className="animate-spin" />}{t('Save', 'حفظ')}</button></div>
      </form>
    </Modal>
  );
}

function SmallForm({ title, fields, onClose, onSubmit }: { title: string; fields: { k: string; label: string; type?: string; options?: [string, string][]; required?: boolean }[]; onClose: () => void; onSubmit: (v: Record<string, string>) => Promise<boolean> }) {
  const t = useT();
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={title}>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); if (await onSubmit(v)) onClose(); setBusy(false); }}>
        {fields.map((f) => <Field key={f.k} label={f.label}>{f.options
          ? <select value={v[f.k] ?? f.options[0][0]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} className={inputCls}>{f.options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select>
          : <input required={f.required} type={f.type ?? 'text'} value={v[f.k] ?? ''} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} className={inputCls} />}</Field>)}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnPrimary}>{t('Save', 'حفظ')}</button></div>
      </form>
    </Modal>
  );
}

export function PlanForm({ mentorshipId, plan, onClose, onSaved }: { mentorshipId: number; plan?: Plan; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const [p, setP] = useState<Partial<Plan>>(plan ?? {});
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={plan ? t('Edit plan', 'تعديل الخطة') : t('Create development plan', 'إنشاء خطة تطوير')}>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); if (await act(() => api.savePlan({ ...p, mentorship_id: mentorshipId }), t('Plan saved', 'تم حفظ الخطة'))) { onSaved(); onClose(); } setBusy(false); }}>
        <Field label={t('Plan title *', 'عنوان الخطة *')}><input required value={p.title ?? ''} onChange={(e) => setP({ ...p, title: e.target.value })} className={inputCls} placeholder={t('e.g. Path to Senior Engineer', 'مثال: الطريق إلى مهندس أول')} /></Field>
        <Field label={t('Summary', 'الملخص')}><textarea rows={3} value={p.summary ?? ''} onChange={(e) => setP({ ...p, summary: e.target.value })} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('Start date', 'تاريخ البدء')}><input type="date" value={p.start_date ?? ''} onChange={(e) => setP({ ...p, start_date: e.target.value || null })} className={inputCls} /></Field>
          <Field label={t('Target review date', 'تاريخ المراجعة المستهدف')}><input type="date" value={p.target_date ?? ''} onChange={(e) => setP({ ...p, target_date: e.target.value || null })} className={inputCls} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnPrimary}>{t('Save', 'حفظ')}</button></div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- Board
export function PlanBoard({ bundle, mode, mentorshipId, reload }: { bundle: api.PlanBundle; mode: PlanMode; mentorshipId: number; reload: () => void }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const { plan, goals, milestones, tasks, resources } = bundle;
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | 'new' | null>(null);
  const [editTask, setEditTask] = useState<{ task?: Task; goal?: number } | null>(null);
  const [editPlan, setEditPlan] = useState(false);
  const [newMs, setNewMs] = useState(false);
  const [newRes, setNewRes] = useState(false);
  const [del, setDel] = useState<(() => Promise<void>) | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => Object.fromEntries(goals.map((g, i) => [g.id, i === 0])));
  const edit = mode === 'mentor';

  if (!plan) return (
    <>
      <Empty icon={<Target size={28} />} title={t('No development plan yet', 'لا توجد خطة تطوير بعد')}
        text={edit ? t('Review the assessment, then create the plan with goals and tasks.', 'راجع التقييم ثم أنشئ الخطة بالأهداف والمهام.') : t('Your mentor will draft your plan after reviewing your assessment.', 'سيُعد مرشدك خطتك بعد مراجعة تقييمك.')}
        action={edit && <button onClick={() => setEditPlan(true)} className={btnAccent}><Plus size={16} />{t('Create plan', 'إنشاء الخطة')}</button>} />
      {editPlan && <PlanForm mentorshipId={mentorshipId} onClose={() => setEditPlan(false)} onSaved={reload} />}
    </>
  );

  const progress = planProgress(goals, tasks);
  const done = tasks.filter((x) => x.status === 'completed').length;
  const overdue = tasks.filter(isOverdue).length;
  const statusAct = (s: Plan['status'], ok: string) => act(() => api.setPlanStatus(plan.id, s), ok).then(reload);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
        <div className="absolute -end-20 -top-20 w-64 h-64 rounded-full bg-orange-50" />
        <Ring value={progress} size={140} sub={t('progress', 'التقدم')} />
        <div className="relative flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2"><StatusPill status={plan.status} /><span className="text-xs text-slate-400 font-bold">v{plan.version}</span></div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{plan.title}</h2>
          {plan.summary && <p className="text-slate-500 mt-1">{plan.summary}</p>}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-slate-500">
            <span><Calendar size={14} className="inline me-1" />{fmtDate(plan.start_date)} → {fmtDate(plan.target_date)}</span>
            <span><b className="text-slate-800">{done}/{tasks.length}</b> {t('tasks done', 'مهام منجزة')}</span>
            {overdue > 0 && <span className="text-red-500 font-bold">{overdue} {t('overdue', 'متأخرة')}</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1"><Info size={12} />{t('Progress = average of goals; each goal = completed ÷ active tasks (an achieved goal counts 100%).', 'التقدم = متوسط الأهداف؛ وكل هدف = المهام المكتملة ÷ المهام الفعّالة (الهدف المتحقق = 100%).')}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {edit && <button onClick={() => setEditPlan(true)} className={`${btnSm} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Pencil size={14} />{t('Edit plan', 'تعديل الخطة')}</button>}
            {edit && plan.status === 'draft' && <button onClick={() => statusAct('pending_approval', t('Sent to mentee for approval', 'أُرسلت للمتدرب للموافقة'))} className={`${btnSm} bg-orange-500 text-white hover:bg-orange-600`}><Send size={14} className="rtl:rotate-180" />{t('Send for approval', 'إرسال للموافقة')}</button>}
            {edit && plan.status === 'active' && <button onClick={() => statusAct('completed', t('Plan completed', 'اكتملت الخطة'))} className={`${btnSm} bg-indigo-600 text-white`}><Flag size={14} />{t('Mark completed', 'إنهاء الخطة')}</button>}
            {mode === 'mentee' && plan.status === 'pending_approval' && <>
              <button onClick={() => statusAct('active', t('Plan approved — let’s go!', 'تم اعتماد الخطة — لننطلق!'))} className={`${btnSm} bg-emerald-600 text-white hover:bg-emerald-700`}><ThumbsUp size={14} />{t('Approve plan', 'اعتماد الخطة')}</button>
              <button onClick={() => statusAct('draft', t('Sent back for clarification', 'أُعيدت للتوضيح'))} className={`${btnSm} bg-slate-100 text-slate-700`}><Undo2 size={14} />{t('Ask for changes', 'طلب توضيح')}</button>
            </>}
          </div>
        </div>
      </div>

      {mode === 'mentee' && plan.status === 'pending_approval' && <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm font-semibold">{t('Your mentor shared this plan. Review the goals below and approve it, or ask for changes.', 'شارك مرشدك هذه الخطة. راجع الأهداف أدناه واعتمدها أو اطلب تعديلات.')}</div>}

      <div className="grid xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Goals */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between"><h3 className="font-extrabold text-slate-900 text-lg">{t('Goals', 'الأهداف')} <span className="text-slate-400 text-sm">({goals.length})</span></h3>
            {edit && <button onClick={() => setEditGoal('new')} className={`${btnSm} bg-indigo-600 text-white hover:bg-indigo-700`}><Plus size={14} />{t('Add goal', 'إضافة هدف')}</button>}</div>
          {!goals.length && <Empty icon={<Target size={24} />} title={t('No goals yet', 'لا توجد أهداف بعد')} />}
          {goals.map((g, idx) => {
            const gt = tasks.filter((x) => x.goal_id === g.id);
            const p = goalProgress(g, tasks);
            const isOpen = !!expanded[g.id];
            return (
              <div key={g.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded((e) => ({ ...e, [g.id]: !isOpen }))} className="w-full text-start p-5 flex items-start gap-4" aria-expanded={isOpen}>
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black grid place-items-center shrink-0">{idx + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-extrabold text-slate-900">{g.title}</span><StatusPill status={g.status} /><StatusPill status={g.priority} /></span>
                    {g.description && <span className="block text-sm text-slate-500 mt-1">{g.description}</span>}
                    <span className="flex items-center gap-3 mt-3"><Progress value={p} className="flex-1" /><span className="text-xs font-black text-slate-600 w-10 text-end">{Math.round(p)}%</span></span>
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform mt-3 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-4">
                    {(g.baseline || g.target || g.success_criteria || g.rationale) && (
                      <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        {g.baseline && <div className="p-3 rounded-2xl bg-slate-50"><p className="text-[10px] font-black uppercase text-slate-400">{t('Starting point', 'نقطة البداية')}</p><p className="text-slate-700 mt-1">{g.baseline}</p></div>}
                        {g.target && <div className="p-3 rounded-2xl bg-indigo-50"><p className="text-[10px] font-black uppercase text-indigo-400">{t('Target', 'المستهدف')}</p><p className="text-indigo-900 mt-1">{g.target}</p></div>}
                        {g.success_criteria && <div className="p-3 rounded-2xl bg-emerald-50"><p className="text-[10px] font-black uppercase text-emerald-500">{t('Evidence', 'دليل الإنجاز')}</p><p className="text-emerald-900 mt-1">{g.success_criteria}</p></div>}
                      </div>
                    )}
                    {g.rationale && <p className="text-xs text-slate-400"><b>{t('Why:', 'السبب:')}</b> {g.rationale}</p>}
                    <div className="space-y-2">{gt.map((x) => <TaskRow key={x.id} task={x} onOpen={() => setOpenTask(x)} />)}</div>
                    {!gt.length && <p className="text-sm text-slate-400">{t('No tasks for this goal yet.', 'لا توجد مهام لهذا الهدف بعد.')}</p>}
                    <div className="flex flex-wrap gap-2 items-center">
                      {g.due_date && <span className="text-xs text-slate-400 me-auto"><Calendar size={12} className="inline me-1" />{t('Target', 'المستهدف')}: {fmtDate(g.due_date)}</span>}
                      {edit && <>
                        <button onClick={() => setEditTask({ goal: g.id })} className={`${btnSm} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}><ListPlus size={14} />{t('Add task', 'إضافة مهمة')}</button>
                        <button onClick={() => setEditGoal(g)} className={`${btnSm} bg-slate-100 text-slate-600`}><Pencil size={14} />{t('Edit', 'تعديل')}</button>
                        <button onClick={() => setDel(() => async () => { await act(() => api.deleteGoal(g.id), t('Goal deleted', 'تم حذف الهدف')); reload(); })} className={`${btnSm} bg-red-50 text-red-500`}><Trash2 size={14} /></button>
                      </>}
                    </div>
                  </div>
                </div></div>
              </div>
            );
          })}
          {edit && tasks.some((x) => !x.goal_id) && <Card title={t('Unlinked tasks', 'مهام غير مرتبطة')}>{tasks.filter((x) => !x.goal_id).map((x) => <TaskRow key={x.id} task={x} onOpen={() => setOpenTask(x)} />)}</Card>}
        </div>

        {/* Side: milestones + resources */}
        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><MilestoneIcon size={18} className="text-orange-500" />{t('Milestones', 'المراحل')}</span>} action={edit && <button onClick={() => setNewMs(true)} className="text-indigo-600" aria-label="add"><Plus size={18} /></button>}>
            {!milestones.length ? <p className="text-sm text-slate-400">{t('No milestones.', 'لا توجد مراحل.')}</p> : (
              <ol className="relative border-s-2 border-slate-100 ms-2 space-y-4">{milestones.map((m: Milestone) => (
                <li key={m.id} className="ps-5 relative">
                  <button disabled={!edit} onClick={() => act(() => api.saveMilestone({ id: m.id, plan_id: plan.id, done: !m.done })).then(reload)} className={`absolute -start-[11px] top-0.5 bg-white ${m.done ? 'text-emerald-500' : 'text-slate-300'}`}>{m.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
                  <p className={`text-sm font-bold ${m.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.title}</p>
                  <p className="text-xs text-slate-400">{fmtDate(m.due_date)}</p>
                </li>
              ))}</ol>
            )}
          </Card>
          <Card title={<span className="flex items-center gap-2"><BookOpen size={18} className="text-indigo-500" />{t('Learning resources', 'مصادر التعلم')}</span>} action={edit && <button onClick={() => setNewRes(true)} className="text-indigo-600" aria-label="add"><Plus size={18} /></button>}>
            {!resources.length ? <p className="text-sm text-slate-400">{t('No resources yet.', 'لا توجد مصادر بعد.')}</p> : (
              <div className="space-y-2">{resources.map((r: Resource) => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 group">
                  <button onClick={() => mode !== 'viewer' && act(() => api.saveResource({ id: r.id, plan_id: plan.id, done: !r.done })).then(reload)} className={r.done ? 'text-emerald-500' : 'text-slate-300'} aria-label="toggle">{r.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button>
                  <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0"><p className={`text-sm font-bold ${r.done ? 'text-slate-400' : 'text-slate-800'} group-hover:text-indigo-700`}>{r.title}</p><p className="text-[11px] text-slate-400 uppercase font-bold">{r.kind}{r.provider && ` · ${r.provider}`}</p></a>
                  {edit && <button onClick={() => act(() => api.deleteResource(r.id)).then(reload)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>}
                </div>
              ))}</div>
            )}
            <p className="text-[11px] text-slate-400 mt-3">{t('External courses (e.g. Udemy Business) are linked manually for now.', 'تُضاف الدورات الخارجية (مثل Udemy Business) يدويًا حاليًا.')}</p>
          </Card>
        </div>
      </div>

      {openTask && <TaskModal task={tasks.find((x) => x.id === openTask.id) ?? openTask} mode={mode} onClose={() => setOpenTask(null)} onChanged={reload} />}
      {editGoal && <GoalForm planId={plan.id} goal={editGoal === 'new' ? undefined : editGoal} onClose={() => setEditGoal(null)} onSaved={reload} />}
      {editTask && <TaskForm planId={plan.id} goals={goals} task={editTask.task} defaultGoal={editTask.goal} onClose={() => setEditTask(null)} onSaved={reload} />}
      {editPlan && <PlanForm mentorshipId={mentorshipId} plan={plan} onClose={() => setEditPlan(false)} onSaved={reload} />}
      {newMs && <SmallForm title={t('New milestone', 'مرحلة جديدة')} onClose={() => setNewMs(false)} fields={[{ k: 'title', label: t('Title', 'العنوان'), required: true }, { k: 'due_date', label: t('Date', 'التاريخ'), type: 'date' }, { k: 'goal_id', label: t('Goal', 'الهدف'), options: [['', '—'], ...goals.map((g) => [String(g.id), g.title] as [string, string])] }]}
        onSubmit={(v) => act(() => api.saveMilestone({ plan_id: plan.id, title: v.title, due_date: v.due_date || null, goal_id: v.goal_id ? Number(v.goal_id) : null }), t('Saved', 'تم الحفظ')).then((ok) => { reload(); return ok; })} />}
      {newRes && <SmallForm title={t('New resource', 'مصدر جديد')} onClose={() => setNewRes(false)} fields={[{ k: 'title', label: t('Title', 'العنوان'), required: true }, { k: 'url', label: 'URL', type: 'url', required: true }, { k: 'provider', label: t('Provider', 'المزود') }, { k: 'kind', label: t('Type', 'النوع'), options: [['article', t('Article', 'مقال')], ['video', t('Video', 'فيديو')], ['course', t('Course', 'دورة')], ['book', t('Book', 'كتاب')], ['tool', t('Tool', 'أداة')]] }, { k: 'goal_id', label: t('Goal', 'الهدف'), options: [['', '—'], ...goals.map((g) => [String(g.id), g.title] as [string, string])] }]}
        onSubmit={(v) => act(() => api.saveResource({ plan_id: plan.id, title: v.title, url: v.url, provider: v.provider || null, kind: (v.kind || 'article') as Resource['kind'], goal_id: v.goal_id ? Number(v.goal_id) : null }), t('Saved', 'تم الحفظ')).then((ok) => { reload(); return ok; })} />}
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={async () => { await del?.(); }} title={t('Delete this item?', 'حذف هذا العنصر؟')} danger text={lang === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This cannot be undone.'} />
    </div>
  );
}
