import { useState } from 'react';
import { Check, Inbox, Loader2, MapPin, X } from 'lucide-react';
import { Empty, Field, Modal, Page, PageHero, Spinner, StatusPill, Tabs, act, btnDanger, btnGhost, btnPrimary, inputCls } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { ago, money } from '../../lib/format';
import { useT } from '../../lib/i18n';
import type { MentorshipRequest } from '../../lib/types';

export default function Applications() {
  const t = useT();
  const q = useAsync(api.incomingRequests);
  const [tab, setTab] = useState<'open' | 'decided'>('open');
  const [sel, setSel] = useState<MentorshipRequest | null>(null);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const all = q.data ?? [];
  const open = all.filter((r) => ['submitted', 'under_review'].includes(r.status));
  const list = tab === 'open' ? open : all.filter((r) => !['submitted', 'under_review'].includes(r.status));
  const openReq = (r: MentorshipRequest) => { setSel(r); setDecision(null); setNote(''); if (r.status === 'submitted') api.markUnderReview(r.id).then(q.reload); };
  const decide = async () => {
    setBusy(true);
    const ok = await act(() => api.decideRequest(sel!.id, decision === 'accept', note), decision === 'accept' ? t('Accepted — mentorship created 🎉', 'تم القبول — أُنشئت علاقة الإرشاد 🎉') : t('Application declined', 'تم الاعتذار عن الطلب'));
    setBusy(false); if (ok) { setSel(null); q.reload(); }
  };
  return (
    <Page>
      <PageHero badge={t('Applications', 'الطلبات')} title={t('Mentorship applications', 'طلبات الإرشاد')} subtitle={t('Read each applicant’s goal and decide. Accepting creates the mentorship and opens a private chat.', 'اقرأ هدف كل متقدم وقرر. القبول يُنشئ علاقة الإرشاد ويفتح محادثة خاصة.')} illus="inbox" />
      <div className="mb-6"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'open', label: t('Open', 'مفتوحة'), count: open.length }, { id: 'decided', label: t('Decided', 'تم البت فيها') }]} /></div>
      {q.loading ? <Spinner /> : !list.length ? <Empty icon={<Inbox size={26} />} title={t('No applications here', 'لا توجد طلبات')} /> : (
        <div className="grid md:grid-cols-2 gap-4">{list.map((r) => (
          <button key={r.id} onClick={() => openReq(r)} className="text-start bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-3"><Avatar name={r.mentee?.full_name ?? '?'} className="w-12 h-12" /><div className="flex-1 min-w-0"><p className="font-extrabold text-slate-900">{r.mentee?.full_name}</p><p className="text-xs text-slate-400">{r.mentee?.headline}</p></div><StatusPill status={r.status} /></div>
            <p className="text-sm text-slate-600 mt-4 line-clamp-3">{r.goal}</p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400"><span className="font-bold text-indigo-600">{r.package?.name}{r.package && ` · ${money(r.package.price, r.package.currency)}`}</span><span>{ago(r.created_at)}</span></div>
          </button>
        ))}</div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={t('Application', 'الطلب')} wide>
        {sel && <>
          <div className="flex items-center gap-4 mb-6"><Avatar name={sel.mentee?.full_name ?? '?'} className="w-14 h-14 text-lg" /><div><p className="text-xl font-extrabold">{sel.mentee?.full_name}</p><p className="text-sm text-slate-500">{sel.mentee?.headline}{sel.mentee?.country && <> · <MapPin size={12} className="inline" /> {sel.mentee.country}</>}</p></div></div>
          {[[t('Goal', 'الهدف'), sel.goal], [t('Background', 'الخلفية'), sel.background], [t('Expectations', 'التوقعات'), sel.expectations]].filter(([, v]) => v).map(([k, v]) => <div key={k} className="mb-4"><p className="text-xs font-black uppercase text-slate-400">{k}</p><p className="text-slate-700 mt-1 whitespace-pre-line">{v}</p></div>)}
          <p className="text-sm p-3 rounded-xl bg-indigo-50 text-indigo-800 font-semibold">{t('Plan', 'الباقة')}: {sel.package?.name} {sel.package && `· ${money(sel.package.price, sel.package.currency)}`}</p>
          {sel.decision_note && <p className="text-sm mt-4 text-slate-500">“{sel.decision_note}”</p>}
          {['submitted', 'under_review'].includes(sel.status) && <div className="mt-6 pt-6 border-t border-slate-100">
            {!decision ? <div className="grid grid-cols-2 gap-3"><button onClick={() => setDecision('reject')} className={btnGhost}><X size={16} />{t('Decline', 'اعتذار')}</button><button onClick={() => setDecision('accept')} className={btnPrimary}><Check size={16} />{t('Accept', 'قبول')}</button></div> : <>
              <Field label={decision === 'accept' ? t('Welcome message (optional)', 'رسالة ترحيب (اختياري)') : t('Reason (shared with the applicant)', 'السبب (يُرسل للمتقدم)')}><textarea required={decision === 'reject'} rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></Field>
              <div className="flex justify-end gap-2 mt-4"><button onClick={() => setDecision(null)} className={btnGhost}>{t('Back', 'رجوع')}</button><button disabled={busy || (decision === 'reject' && !note)} onClick={decide} className={decision === 'accept' ? btnPrimary : btnDanger}>{busy && <Loader2 size={16} className="animate-spin" />}{decision === 'accept' ? t('Confirm acceptance', 'تأكيد القبول') : t('Confirm decline', 'تأكيد الاعتذار')}</button></div>
            </>}
          </div>}
        </>}
      </Modal>
    </Page>
  );
}
