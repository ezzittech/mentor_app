import { useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { Empty, Page, PageHero, Spinner } from '../../components/ui';
import { TaskModal, TaskRow } from '../../components/plan';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useT } from '../../lib/i18n';
import type { Task } from '../../lib/types';

export default function ReviewQueue() {
  const t = useT();
  const q = useAsync(api.submittedTasks);
  const [open, setOpen] = useState<Task | null>(null);
  const byMentee = Object.entries((q.data ?? []).reduce<Record<string, typeof q.data>>((a, x) => { (a[x!.mentee_name] ??= []).push(x); return a; }, {}));
  return (
    <Page>
      <PageHero badge={t('Reviews', 'المراجعات')} badgeColor="purple" title={t('Submissions to review', 'تسليمات بانتظار المراجعة')} subtitle={t('Approve the work or request changes with clear feedback.', 'اعتمد العمل أو اطلب تعديلات مع تغذية راجعة واضحة.')} illus="reviews" />
      {q.loading ? <Spinner /> : !byMentee.length ? <Empty icon={<BookOpenCheck size={26} />} title={t('Inbox zero 🎉', 'لا توجد تسليمات 🎉')} text={t('Nothing is waiting for your review.', 'لا يوجد ما ينتظر مراجعتك.')} /> : (
        <div className="space-y-8">{byMentee.map(([name, list]) => (
          <section key={name}><h2 className="font-extrabold text-slate-900 mb-3">{name} <span className="text-slate-400 text-sm">({list!.length})</span></h2><div className="space-y-2">{list!.map((x) => <TaskRow key={x.id} task={x} onOpen={() => setOpen(x)} />)}</div></section>
        ))}</div>
      )}
      {open && <TaskModal task={open} mode="mentor" onClose={() => setOpen(null)} onChanged={() => { q.reload(); setOpen(null); }} />}
    </Page>
  );
}
