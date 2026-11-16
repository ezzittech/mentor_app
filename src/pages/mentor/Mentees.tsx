import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { Empty, Page, PageHero, SearchInput, Spinner, StatusPill, Tabs } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { ago, fmtDate } from '../../lib/format';
import { useT } from '../../lib/i18n';
import type { MentorshipStatus } from '../../lib/types';

export function MentorshipList({ base, role }: { base: string; role: 'mentor' | 'supervisor' }) {
  const t = useT();
  const q = useAsync(() => api.mentorshipsAs(role), [role]);
  const [f, setF] = useState<'all' | MentorshipStatus>('all');
  const [s, setS] = useState('');
  const list = (q.data ?? []).filter((m) => (f === 'all' || m.status === f) && (!s || (m.mentee?.full_name ?? '').toLowerCase().includes(s.toLowerCase())));
  const count = (st: MentorshipStatus) => (q.data ?? []).filter((m) => m.status === st).length;
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <Tabs value={f} onChange={setF} tabs={[{ id: 'all', label: t('All', 'الكل'), count: q.data?.length }, { id: 'active', label: t('Active', 'نشط'), count: count('active') }, { id: 'pending_setup', label: t('Setting up', 'قيد الإعداد'), count: count('pending_setup') }, { id: 'paused', label: t('Paused', 'متوقف'), count: count('paused') }, { id: 'completed', label: t('Completed', 'مكتمل'), count: count('completed') }]} />
        <SearchInput value={s} onChange={setS} placeholder={t('Search mentees…', 'ابحث عن متدرب…')} />
      </div>
      {q.loading ? <Spinner /> : !list.length ? <Empty icon={<Users size={26} />} title={t('No mentees', 'لا يوجد متدربون')} /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{list.map((m) => (
          <Link key={m.id} to={`${base}/${m.id}`} className="group bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3"><Avatar name={m.mentee?.full_name ?? '?'} className="w-12 h-12" /><div className="flex-1 min-w-0"><p className="font-extrabold text-slate-900 group-hover:text-indigo-700">{m.mentee?.full_name}</p><p className="text-xs text-slate-400 truncate">{m.mentee?.headline}</p></div><StatusPill status={m.status} /></div>
            <div className="grid grid-cols-2 gap-2 mt-5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50"><p className="text-slate-400">{role === 'mentor' ? t('Plan', 'الباقة') : t('Mentor', 'المرشد')}</p><p className="font-bold text-slate-700 truncate">{role === 'mentor' ? m.package?.name : m.mentor?.full_name}</p></div>
              <div className="p-2.5 rounded-xl bg-slate-50"><p className="text-slate-400">{t('Last activity', 'آخر نشاط')}</p><p className="font-bold text-slate-700">{m.last_activity_at ? ago(m.last_activity_at) : '—'}</p></div>
            </div>
            <p className="text-xs text-slate-400 mt-4 flex justify-between">{t('Since', 'منذ')} {fmtDate(m.started_at)}<span className="font-bold text-indigo-600 flex items-center gap-1">{t('Open', 'فتح')}<ArrowRight size={12} className="rtl:rotate-180" /></span></p>
          </Link>
        ))}</div>
      )}
    </>
  );
}

export default function MyMentees() {
  const t = useT();
  return <Page><PageHero badge={t('Mentees', 'المتدربون')} title={t('My mentees', 'متدربيّ')} subtitle={t('Open a mentee to manage their assessment, plan, tasks and sessions.', 'افتح ملف المتدرب لإدارة تقييمه وخطته ومهامه وجلساته.')} illus="mentors" /><MentorshipList base="/app/mentor/mentees" role="mentor" /></Page>;
}
