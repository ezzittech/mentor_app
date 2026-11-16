import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Check, ExternalLink, Sparkles, UserRoundCheck, X } from 'lucide-react';
import { Empty, Page, PageHero, Spinner, StatusPill, Tabs, act, btnSm } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDate } from '../../lib/format';
import { useT } from '../../lib/i18n';
import type { MentorStatus } from '../../lib/types';

export default function MentorApprovals() {
  const t = useT();
  const q = useAsync(api.mentorApplications);
  const [f, setF] = useState<MentorStatus>('pending');
  const list = (q.data ?? []).filter((m) => m.status === f);
  const count = (s: MentorStatus) => (q.data ?? []).filter((m) => m.status === s).length;
  const decide = (id: string, s: 'approved' | 'rejected' | 'suspended', featured?: boolean) => act(() => api.decideMentor(id, s, featured), t('Updated', 'تم التحديث')).then(q.reload);
  return (
    <Page>
      <PageHero badge={t('Mentors', 'المرشدون')} badgeColor="orange" title={t('Mentor approvals', 'اعتماد المرشدين')} subtitle={t('Only approved mentors are visible in the public directory.', 'لا يظهر في الدليل العام إلا المرشدون المعتمدون.')} illus="star" />
      <div className="mb-6"><Tabs value={f} onChange={setF} tabs={(['pending', 'approved', 'draft', 'rejected', 'suspended'] as MentorStatus[]).map((s) => ({ id: s, label: <StatusPill status={s} />, count: count(s) }))} /></div>
      {q.loading ? <Spinner /> : !list.length ? <Empty icon={<UserRoundCheck size={26} />} title={t('Nothing here', 'لا يوجد شيء هنا')} /> : (
        <div className="space-y-3">{list.map((m) => (
          <div key={m.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0"><Avatar name={m.full_name} className="w-12 h-12" /><div className="min-w-0"><p className="font-extrabold text-slate-900 flex items-center gap-2">{m.full_name}{m.featured && <Sparkles size={14} className="text-orange-500" />}</p><p className="text-sm text-slate-500 truncate">{m.headline}</p><p className="text-xs text-slate-400">{m.job_title} · {m.company} · {m.years_experience} {t('yrs', 'سنوات')} · {fmtDate(m.created_at)}</p></div></div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/mentors/${m.slug}`} target="_blank" className={`${btnSm} bg-slate-100 text-slate-600`}><ExternalLink size={13} />{t('Preview', 'معاينة')}</Link>
              {m.status !== 'approved' && <button onClick={() => decide(m.id, 'approved')} className={`${btnSm} bg-emerald-600 text-white`}><Check size={13} />{t('Approve', 'اعتماد')}</button>}
              {m.status === 'pending' && <button onClick={() => decide(m.id, 'rejected')} className={`${btnSm} bg-red-50 text-red-600`}><X size={13} />{t('Reject', 'رفض')}</button>}
              {m.status === 'approved' && <><button onClick={() => decide(m.id, 'approved', !m.featured)} className={`${btnSm} bg-orange-50 text-orange-600`}><Sparkles size={13} />{m.featured ? t('Unfeature', 'إلغاء التمييز') : t('Feature', 'تمييز')}</button>
                <button onClick={() => decide(m.id, 'suspended')} className={`${btnSm} bg-red-50 text-red-600`}><Ban size={13} />{t('Suspend', 'إيقاف')}</button></>}
            </div>
          </div>
        ))}</div>
      )}
    </Page>
  );
}
