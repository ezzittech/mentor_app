import { useState } from 'react';
import { CalendarClock, CalendarPlus, Clock, ExternalLink, Globe, NotebookPen, Video } from 'lucide-react';
import { Empty, Field, Modal, Page, PageHero, Spinner, StatusPill, Tabs, act, btnAccent, btnGhost, btnPrimary, btnSm, inputCls } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { browserTz, fmtDateTime } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';
import type { Mentorship, Role, Session } from '../../lib/types';

export function SessionForm({ mentorships, session, onClose, onSaved }: { mentorships: Mentorship[]; session?: Session; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const local = (iso?: string) => { const d = iso ? new Date(iso) : new Date(Date.now() + 2 * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const [s, setS] = useState({ mentorship_id: session?.mentorship_id ?? mentorships[0]?.id, title: session?.title ?? '', when: local(session?.starts_at), duration_min: session?.duration_min ?? 45, meeting_url: session?.meeting_url ?? '', agenda: session?.agenda ?? '', shared_notes: session?.shared_notes ?? '', status: session?.status ?? 'scheduled' });
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={session ? t('Edit session', 'تعديل الجلسة') : t('Schedule a session', 'جدولة جلسة')} wide>
      <form className="grid sm:grid-cols-2 gap-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        // stored in UTC (timestamptz); the user's IANA zone is kept for display
        const ok = await act(() => api.saveSession({ id: session?.id, mentorship_id: s.mentorship_id!, title: s.title, starts_at: new Date(s.when).toISOString(), duration_min: Number(s.duration_min), timezone: browserTz(), meeting_url: s.meeting_url || null, agenda: s.agenda || null, shared_notes: s.shared_notes || null, status: s.status as Session['status'] }), t('Session saved', 'تم حفظ الجلسة'));
        setBusy(false); if (ok) { onSaved(); onClose(); }
      }}>
        {!session && <Field label={t('Mentee', 'المتدرب')} className="sm:col-span-2"><select value={s.mentorship_id} onChange={(e) => setS({ ...s, mentorship_id: Number(e.target.value) })} className={inputCls}>{mentorships.map((m) => <option key={m.id} value={m.id}>{m.mentee?.full_name}</option>)}</select></Field>}
        <Field label={t('Title *', 'العنوان *')} className="sm:col-span-2"><input required value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} className={inputCls} /></Field>
        <Field label={t('Date & time', 'التاريخ والوقت')} hint={browserTz()}><input required type="datetime-local" value={s.when} onChange={(e) => setS({ ...s, when: e.target.value })} className={inputCls} /></Field>
        <Field label={t('Duration (min)', 'المدة (دقيقة)')}><input type="number" min={15} step={15} value={s.duration_min} onChange={(e) => setS({ ...s, duration_min: Number(e.target.value) })} className={inputCls} /></Field>
        <Field label={t('Meeting link (Zoom / Google Meet)', 'رابط الاجتماع (Zoom / Google Meet)')} className="sm:col-span-2"><input type="url" value={s.meeting_url} onChange={(e) => setS({ ...s, meeting_url: e.target.value })} className={inputCls} dir="ltr" placeholder="https://meet.google.com/..." /></Field>
        <Field label={t('Agenda', 'جدول الأعمال')} className="sm:col-span-2"><textarea rows={2} value={s.agenda} onChange={(e) => setS({ ...s, agenda: e.target.value })} className={inputCls} /></Field>
        {session && <>
          <Field label={t('Status', 'الحالة')}><select value={s.status} onChange={(e) => setS({ ...s, status: e.target.value as Session['status'] })} className={inputCls}>{['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'failed'].map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
          <Field label={t('Shared notes (visible to mentee)', 'ملاحظات مشتركة (يراها المتدرب)')} className="sm:col-span-2"><textarea rows={3} value={s.shared_notes} onChange={(e) => setS({ ...s, shared_notes: e.target.value })} className={inputCls} /></Field>
        </>}
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnPrimary}>{t('Save', 'حفظ')}</button></div>
      </form>
    </Modal>
  );
}

export function SessionCard({ s, onEdit, canEdit }: { s: Session; onEdit?: () => void; canEdit?: boolean }) {
  const t = useT();
  const lang = useLang((x) => x.lang);
  const d = new Date(s.starts_at);
  const soon = d.getTime() - Date.now() < 15 * 60000 && d.getTime() + s.duration_min * 60000 > Date.now();
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex gap-5 hover:shadow-md transition-all">
      <div className="w-16 shrink-0 text-center rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-800 text-white py-2.5">
        <p className="text-[10px] font-bold uppercase opacity-80">{d.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { month: 'short' })}</p>
        <p className="text-2xl font-black leading-none my-0.5">{d.getDate()}</p>
        <p className="text-[10px] font-bold opacity-80">{d.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { weekday: 'short' })}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-slate-900">{s.title}</p><StatusPill status={s.status} /></div>
        <p className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4"><span><Clock size={13} className="inline me-1" />{fmtDateTime(s.starts_at)} · {s.duration_min} {t('min', 'د')}</span><span><Globe size={13} className="inline me-1" />{browserTz()}</span></p>
        <p className="text-xs text-slate-400 mt-1">{s.mentee?.full_name} ↔ {s.mentor?.full_name}</p>
        {s.agenda && <p className="text-sm text-slate-600 mt-2"><b>{t('Agenda:', 'جدول الأعمال:')}</b> {s.agenda}</p>}
        {s.shared_notes && <p className="text-sm text-slate-600 mt-2 p-3 rounded-xl bg-slate-50"><NotebookPen size={13} className="inline me-1 text-indigo-500" />{s.shared_notes}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {s.meeting_url && ['scheduled', 'confirmed'].includes(s.status) && <a href={s.meeting_url} target="_blank" rel="noreferrer" className={`${btnSm} ${soon ? 'bg-emerald-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-700'}`}><Video size={14} />{soon ? t('Join now', 'انضم الآن') : t('Meeting link', 'رابط الاجتماع')}<ExternalLink size={12} /></a>}
          {canEdit && onEdit && <button onClick={onEdit} className={`${btnSm} bg-slate-100 text-slate-600`}>{t('Edit / notes', 'تعديل / ملاحظات')}</button>}
        </div>
      </div>
    </div>
  );
}

export default function Sessions({ role }: { role: Role }) {
  const t = useT();
  const q = useAsync(async () => ({ sessions: await api.listSessions({ role }), ms: role === 'mentor' ? await api.mentorshipsAs('mentor') : [] }), [role]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [edit, setEdit] = useState<Session | 'new' | null>(null);
  const now = new Date().toISOString();
  const list = (q.data?.sessions ?? []).filter((s) => (tab === 'upcoming' ? s.starts_at >= now : s.starts_at < now));
  if (tab === 'past') list.reverse();
  const active = (q.data?.ms ?? []).filter((m) => ['active', 'pending_setup'].includes(m.status));
  return (
    <Page>
      <PageHero badge={t('Sessions', 'الجلسات')} badgeColor="sky" title={t('1:1 sessions', 'الجلسات الفردية')} subtitle={t('Times are stored in UTC and shown in your time zone. Use Zoom or Google Meet links.', 'تُخزّن الأوقات بتوقيت UTC وتُعرض حسب منطقتك الزمنية. استخدم روابط Zoom أو Google Meet.')} illus="sessions">
        {role === 'mentor' && <button disabled={!active.length} onClick={() => setEdit('new')} className={btnAccent}><CalendarPlus size={16} />{t('Schedule session', 'جدولة جلسة')}</button>}
      </PageHero>
      <div className="mb-6"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'upcoming', label: t('Upcoming', 'القادمة') }, { id: 'past', label: t('Past', 'السابقة') }]} /></div>
      {q.loading ? <Spinner /> : !list.length ? <Empty icon={<CalendarClock size={26} />} title={t('No sessions', 'لا توجد جلسات')} /> : <div className="grid lg:grid-cols-2 gap-4">{list.map((s) => <SessionCard key={s.id} s={s} canEdit={role === 'mentor'} onEdit={() => setEdit(s)} />)}</div>}
      {edit && <SessionForm mentorships={active} session={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} onSaved={q.reload} />}
    </Page>
  );
}
