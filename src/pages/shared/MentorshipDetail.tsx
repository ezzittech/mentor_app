import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, BellRing, CalendarPlus, CheckCircle2, ClipboardList, Eye, EyeOff, Lock, Pause, Play, Plus, ShieldAlert, Users } from 'lucide-react';
import { Card, Empty, Field, Page, Spinner, StatusPill, Tabs, act, btnAccent, btnGhost, btnPrimary, btnSm, inputCls } from '../../components/ui';
import { Avatar } from '../../components/media';
import { PlanBoard, isOverdue, planProgress } from '../../components/plan';
import { AnswerView } from '../mentee/Assessment';
import { SessionCard, SessionForm } from './Sessions';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { ago, fmtDate } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';
import type { Intervention, NoteVisibility } from '../../lib/types';

type As = 'mentor' | 'supervisor' | 'admin';

function Supervision({ id, as }: { id: number; as: As }) {
  const t = useT();
  const notes = useAsync(() => api.listNotes(id), [id]);
  const ints = useAsync(() => api.listInterventions(id), [id]);
  const [body, setBody] = useState('');
  const [vis, setVis] = useState<NoteVisibility>('staff');
  const [kind, setKind] = useState<Intervention['kind']>('reminder');
  const [inote, setInote] = useState('');
  const KIND = { reminder: t('Reminder', 'تذكير'), reschedule: t('Reschedule', 'إعادة جدولة'), plan_revision: t('Plan revision', 'تعديل الخطة'), escalation: t('Escalation', 'تصعيد'), check_in: t('Check-in', 'متابعة') };
  const VIS = { private: [t('Only me', 'أنا فقط'), Lock], staff: [t('Mentor & supervisors', 'المرشد والمشرفون'), EyeOff], mentee: [t('Also the mentee', 'والمتدرب أيضًا'), Eye] } as const;
  const canWrite = as !== 'admin' || true;
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <Card title={t('Supervision notes', 'ملاحظات إشرافية')}>
        {canWrite && <form className="space-y-3 mb-6" onSubmit={async (e) => { e.preventDefault(); if (await act(() => api.addNote(id, body, vis), t('Note added', 'تمت إضافة الملاحظة'))) { setBody(''); notes.reload(); } }}>
          <textarea required rows={3} value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} placeholder={t('Write a note…', 'اكتب ملاحظة…')} />
          <div className="flex flex-wrap gap-2 items-center">
            {(Object.keys(VIS) as NoteVisibility[]).map((v) => { const [l, I] = VIS[v]; return <button type="button" key={v} onClick={() => setVis(v)} className={`${btnSm} ${vis === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}><I size={13} />{l}</button>; })}
            <button className={`${btnSm} bg-orange-500 text-white ms-auto`}><Plus size={14} />{t('Add', 'إضافة')}</button>
          </div>
        </form>}
        {!notes.data?.length ? <p className="text-sm text-slate-400">{t('No notes.', 'لا توجد ملاحظات.')}</p> : <div className="space-y-3">{notes.data.map((n) => (
          <div key={n.id} className="p-4 rounded-2xl bg-slate-50"><div className="flex items-center justify-between gap-2 mb-1"><b className="text-sm">{n.author?.full_name}</b><span className="text-[10px] font-bold uppercase text-slate-400">{VIS[n.visibility][0]} · {ago(n.created_at)}</span></div><p className="text-sm text-slate-700">{n.body}</p></div>
        ))}</div>}
      </Card>
      <Card title={t('Interventions', 'التدخلات')}>
        {as !== 'mentor' && <form className="space-y-3 mb-6" onSubmit={async (e) => { e.preventDefault(); if (await act(() => api.addIntervention(id, kind, inote), t('Intervention logged', 'تم تسجيل التدخل'))) { setInote(''); ints.reload(); } }}>
          <div className="flex flex-wrap gap-2">{(Object.keys(KIND) as Intervention['kind'][]).map((k) => <button type="button" key={k} onClick={() => setKind(k)} className={`${btnSm} ${kind === k ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{KIND[k]}</button>)}</div>
          <div className="flex gap-2"><input required value={inote} onChange={(e) => setInote(e.target.value)} className={inputCls} placeholder={t('What action was taken and why?', 'ما الإجراء المتخذ ولماذا؟')} /><button className={btnPrimary}><BellRing size={16} /></button></div>
        </form>}
        {!ints.data?.length ? <p className="text-sm text-slate-400">{t('No interventions.', 'لا توجد تدخلات.')}</p> : <div className="space-y-3">{ints.data.map((i) => (
          <div key={i.id} className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100">
            <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${i.kind === 'escalation' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>{i.kind === 'escalation' ? <ShieldAlert size={16} /> : <BellRing size={16} />}</span>
            <div className="flex-1"><p className="text-sm font-bold text-slate-800">{KIND[i.kind]} <span className="text-xs text-slate-400 font-normal">· {ago(i.created_at)}</span></p><p className="text-sm text-slate-600">{i.note}</p></div>
            {i.status === 'open' && as !== 'mentor' ? <button onClick={() => act(() => api.resolveIntervention(i.id), t('Resolved', 'تم الحل')).then(ints.reload)} className={`${btnSm} bg-emerald-50 text-emerald-700`}><CheckCircle2 size={14} />{t('Resolve', 'حل')}</button> : <StatusPill status={i.status} />}
          </div>
        ))}</div>}
      </Card>
    </div>
  );
}

export default function MentorshipDetail({ as }: { as: As }) {
  const { id: raw } = useParams();
  const id = Number(raw);
  const t = useT();
  const lang = useLang((s) => s.lang);
  const q = useAsync(async () => {
    const ms = await api.getMentorship(id);
    if (!ms) return null;
    const [bundle, assessment, questions, sessions] = await Promise.all([api.planForMentorship(id), api.myAssessment(ms.mentee_id), api.assessmentQuestions(), api.listSessions({ mentorshipId: id })]);
    return { ms, bundle, assessment, questions, sessions };
  }, [id]);
  const [tab, setTab] = useState<'plan' | 'assessment' | 'sessions' | 'supervision'>('plan');
  const [note, setNote] = useState('');
  const [newSession, setNewSession] = useState(false);

  if (q.loading && !q.data) return <Page><Spinner /></Page>;
  if (!q.data) return <Page><Empty icon={<Users size={26} />} title={t('Mentorship not found', 'العلاقة غير موجودة')} /></Page>;
  const { ms, bundle, assessment, questions, sessions } = q.data;
  const progress = planProgress(bundle.goals, bundle.tasks);
  const overdue = bundle.tasks.filter(isOverdue).length;
  const setStatus = (s: typeof ms.status, ok: string) => act(() => api.setMentorshipStatus(id, s), ok).then(q.reload);

  return (
    <Page>
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
        <div className="absolute -end-16 -top-16 w-56 h-56 rounded-full bg-indigo-50" />
        <Avatar name={ms.mentee?.full_name ?? '?'} className="w-20 h-20 text-2xl relative" />
        <div className="flex-1 relative">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold text-slate-900">{ms.mentee?.full_name}</h1><StatusPill status={ms.status} /></div>
          <p className="text-slate-500">{ms.mentee?.headline}</p>
          <p className="text-xs text-slate-400 mt-2">{t('Mentor', 'المرشد')}: <b className="text-slate-600">{ms.mentor?.full_name}</b> · {t('Supervisor', 'المشرف')}: <b className="text-slate-600">{ms.supervisor?.full_name ?? '—'}</b> · {ms.package?.name} · {t('since', 'منذ')} {fmtDate(ms.started_at)}</p>
        </div>
        <div className="relative flex gap-6 text-center">
          <div><p className="text-2xl font-black text-indigo-600">{Math.round(progress)}%</p><p className="text-[10px] font-bold uppercase text-slate-400">{t('progress', 'التقدم')}</p></div>
          <div><p className={`text-2xl font-black ${overdue ? 'text-red-500' : 'text-slate-800'}`}>{overdue}</p><p className="text-[10px] font-bold uppercase text-slate-400">{t('overdue', 'متأخرة')}</p></div>
        </div>
        {as === 'mentor' && <div className="relative flex flex-wrap gap-2">
          {ms.status === 'pending_setup' && <button onClick={() => setStatus('active', t('Mentorship activated', 'تم تفعيل الإرشاد'))} className={btnAccent}><Play size={16} />{t('Activate', 'تفعيل')}</button>}
          {ms.status === 'active' && <button onClick={() => setStatus('paused', t('Paused', 'تم الإيقاف المؤقت'))} className={btnGhost}><Pause size={16} />{t('Pause', 'إيقاف مؤقت')}</button>}
          {ms.status === 'paused' && <button onClick={() => setStatus('active', t('Resumed', 'تم الاستئناف'))} className={btnGhost}><Play size={16} />{t('Resume', 'استئناف')}</button>}
        </div>}
      </div>

      <div className="mb-6"><Tabs value={tab} onChange={setTab} tabs={[
        { id: 'plan', label: t('Development plan', 'خطة التطوير') },
        { id: 'assessment', label: t('Assessment', 'التقييم') },
        { id: 'sessions', label: t('Sessions', 'الجلسات'), count: sessions.length },
        { id: 'supervision', label: t('Supervision', 'الإشراف') },
      ]} /></div>

      {tab === 'plan' && <PlanBoard bundle={bundle} mode={as === 'mentor' ? 'mentor' : 'viewer'} mentorshipId={id} reload={q.reload} />}

      {tab === 'assessment' && (!assessment ? <Empty icon={<ClipboardList size={26} />} title={t('No assessment yet', 'لا يوجد تقييم بعد')} text={t('The mentee has not submitted the initial assessment.', 'لم يرسل المتدرب التقييم الأولي بعد.')} /> : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <Card title={<span className="flex items-center gap-2">{t('Initial assessment', 'التقييم الأولي')}<StatusPill status={assessment.status} /></span>}>
            <dl className="grid sm:grid-cols-2 gap-5">{questions.map((x) => <div key={x.id} className={x.kind === 'long' ? 'sm:col-span-2' : ''}><dt className="text-xs font-bold text-slate-400">{lang === 'ar' ? x.prompt_ar : x.prompt_en}</dt><dd className="text-sm text-slate-800 mt-1"><AnswerView q={x} v={assessment.answers[x.id]} /></dd></div>)}</dl>
          </Card>
          {as === 'mentor' && <Card title={t('Your review', 'مراجعتك')}>
            {assessment.review_note && <p className="text-sm text-slate-600 p-3 rounded-xl bg-slate-50 mb-4">{assessment.review_note}</p>}
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder={t('Gaps, priorities, questions…', 'الفجوات والأولويات والأسئلة…')} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button disabled={!note} onClick={() => act(() => api.reviewAssessment(assessment.id, 'needs_info', note), t('Sent to mentee', 'أُرسل للمتدرب')).then(q.reload)} className={`${btnSm} bg-orange-50 text-orange-700 py-3`}><AlertTriangle size={14} />{t('Needs info', 'يحتاج معلومات')}</button>
              <button disabled={!note} onClick={() => act(() => api.reviewAssessment(assessment.id, 'reviewed', note), t('Assessment reviewed', 'تمت المراجعة')).then(q.reload)} className={`${btnSm} bg-emerald-600 text-white py-3`}><CheckCircle2 size={14} />{t('Mark reviewed', 'تمت المراجعة')}</button>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">{t('The assessment supports discussion — it is not a diagnosis.', 'التقييم أداة لدعم النقاش — وليس تشخيصًا.')}</p>
          </Card>}
        </div>
      ))}

      {tab === 'sessions' && <div>
        {as === 'mentor' && <button onClick={() => setNewSession(true)} className={`${btnAccent} mb-4`}><CalendarPlus size={16} />{t('Schedule session', 'جدولة جلسة')}</button>}
        {!sessions.length ? <Empty icon={<CalendarPlus size={26} />} title={t('No sessions yet', 'لا توجد جلسات بعد')} /> : <div className="grid lg:grid-cols-2 gap-4">{[...sessions].reverse().map((s) => <SessionCard key={s.id} s={s} />)}</div>}
        {newSession && <SessionForm mentorships={[ms]} onClose={() => setNewSession(false)} onSaved={q.reload} />}
      </div>}

      {tab === 'supervision' && <Supervision id={id} as={as} />}
    </Page>
  );
}
