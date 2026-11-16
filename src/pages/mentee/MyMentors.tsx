import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, MessagesSquare, Search, Star, X } from 'lucide-react';
import { Card, Confirm, Empty, Field, Modal, Page, PageHero, Spinner, StatusPill, Stars, act, btnAccent, btnPrimary, inputCls } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDate } from '../../lib/format';
import { useT } from '../../lib/i18n';
import type { Mentorship } from '../../lib/types';

export default function MyMentors() {
  const t = useT();
  const q = useAsync(async () => ({ ms: await api.mentorshipsAs('mentee'), reqs: await api.myRequests() }));
  const [cancel, setCancel] = useState<number | null>(null);
  const [review, setReview] = useState<Mentorship | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <Page>
      <PageHero badge={t('Mentorship', 'الإرشاد')} title={t('My mentors & applications', 'مرشدوني وطلباتي')} subtitle={t('Track your applications and active mentorships.', 'تابع طلباتك وعلاقات الإرشاد النشطة.')} illus="mentors">
        <Link to="/mentors" className={btnAccent}><Search size={16} />{t('Find a mentor', 'ابحث عن مرشد')}</Link>
      </PageHero>
      {q.loading || !q.data ? <Spinner /> : (
        <div className="space-y-8">
          <section>
            <h2 className="font-extrabold text-slate-900 text-lg mb-4">{t('Mentorships', 'علاقات الإرشاد')}</h2>
            {!q.data.ms.length ? <Empty icon={<Search size={26} />} title={t('No mentorships yet', 'لا توجد علاقات إرشاد بعد')} /> : (
              <div className="grid md:grid-cols-2 gap-4">{q.data.ms.map((m) => (
                <Card key={m.id}>
                  <div className="flex items-center gap-4"><Avatar name={m.mentor?.full_name ?? '?'} className="w-14 h-14 text-lg" /><div className="flex-1 min-w-0"><p className="font-extrabold text-slate-900">{m.mentor?.full_name}</p><p className="text-xs text-slate-400 truncate">{m.mentor?.headline}</p></div><StatusPill status={m.status} /></div>
                  <div className="grid grid-cols-3 gap-2 mt-5 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50"><p className="text-slate-400">{t('Plan', 'الباقة')}</p><p className="font-bold text-slate-700">{m.package?.name || '—'}</p></div>
                    <div className="p-2 rounded-xl bg-slate-50"><p className="text-slate-400">{t('Since', 'منذ')}</p><p className="font-bold text-slate-700">{fmtDate(m.started_at)}</p></div>
                    <div className="p-2 rounded-xl bg-slate-50"><p className="text-slate-400">{t('Supervisor', 'المشرف')}</p><p className="font-bold text-slate-700 truncate">{m.supervisor?.full_name ?? '—'}</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link to="/app/messages" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold"><MessagesSquare size={16} />{t('Message', 'مراسلة')}</Link>
                    {['active', 'completed'].includes(m.status) && <button onClick={() => setReview(m)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 text-orange-700 text-sm font-bold"><Star size={16} />{t('Leave a review', 'أضف تقييمًا')}</button>}
                  </div>
                </Card>
              ))}</div>
            )}
          </section>
          <section>
            <h2 className="font-extrabold text-slate-900 text-lg mb-4">{t('Applications', 'الطلبات')}</h2>
            {!q.data.reqs.length ? <Empty icon={<Inbox size={26} />} title={t('No applications', 'لا توجد طلبات')} /> : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">{q.data.reqs.map((r) => (
                <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar name={r.mentor?.full_name ?? '?'} className="w-11 h-11 text-sm" />
                  <div className="flex-1 min-w-0"><Link to={`/mentors/${r.mentor?.slug}`} className="font-bold text-slate-900 hover:text-indigo-700">{r.mentor?.full_name}</Link><p className="text-xs text-slate-400">{r.package?.name} · {fmtDate(r.created_at)}</p><p className="text-sm text-slate-600 mt-1 line-clamp-1">{r.goal}</p>{r.decision_note && <p className="text-xs text-indigo-600 mt-1">“{r.decision_note}”</p>}</div>
                  <StatusPill status={r.status} />
                  {['submitted', 'under_review'].includes(r.status) && <button onClick={() => setCancel(r.id)} className="text-xs font-bold text-red-500 flex items-center gap-1"><X size={14} />{t('Withdraw', 'سحب')}</button>}
                </div>
              ))}</div>
            )}
          </section>
        </div>
      )}
      <Confirm open={!!cancel} onClose={() => setCancel(null)} danger title={t('Withdraw this application?', 'سحب هذا الطلب؟')} onConfirm={async () => { await act(() => api.cancelRequest(cancel!), t('Application withdrawn', 'تم سحب الطلب')); q.reload(); }} />
      <Modal open={!!review} onClose={() => setReview(null)} title={t('Review your mentor', 'قيّم مرشدك')}>
        <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); if (await act(() => api.leaveReview(review!.id, review!.mentor_id, rating, comment), t('Thanks for your review!', 'شكرًا لتقييمك!'))) setReview(null); }}>
          <div className="text-center"><Stars value={rating} size={32} onChange={setRating} /></div>
          <Field label={t('Your experience', 'تجربتك')}><textarea required minLength={10} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} className={inputCls} /></Field>
          <p className="text-xs text-slate-400">{t('Your review appears on the mentor’s public profile (first name only). The mentor cannot edit it; admins can hide abusive reviews.', 'يظهر تقييمك في ملف المرشد العام (بالاسم الأول فقط). لا يستطيع المرشد تعديله، ويمكن للإدارة إخفاء التقييمات المسيئة.')}</p>
          <button className={`${btnPrimary} w-full`}>{t('Submit review', 'إرسال التقييم')}</button>
        </form>
      </Modal>
    </Page>
  );
}
