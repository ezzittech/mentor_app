import { useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Empty, Page, PageHero, Spinner, Tabs } from '../../components/ui';
import { TaskModal, TaskRow, isOverdue } from '../../components/plan';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useT } from '../../lib/i18n';
import type { Task } from '../../lib/types';

type F = 'open' | 'review' | 'overdue' | 'done' | 'all';

export default function MenteeTasks() {
  const t = useT();
  const q = useAsync(api.myTasks);
  const [f, setF] = useState<F>('open');
  const [open, setOpen] = useState<Task | null>(null);
  const all = q.data ?? [];
  const groups = useMemo(() => ({
    open: all.filter((x) => ['not_started', 'in_progress', 'changes_requested'].includes(x.status)),
    review: all.filter((x) => x.status === 'submitted'),
    overdue: all.filter(isOverdue),
    done: all.filter((x) => x.status === 'completed'),
    all,
  }), [all]);
  const list = [...groups[f]].sort((a, b) => (a.due_date ?? '9').localeCompare(b.due_date ?? '9'));
  return (
    <Page>
      <PageHero badge={t('Tasks', 'المهام')} badgeColor="indigo" title={t('Learn by doing', 'تعلّم بالتطبيق')} subtitle={t('Start a task, submit your work and get feedback from your mentor.', 'ابدأ المهمة، وسلّم عملك، واحصل على تغذية راجعة من مرشدك.')} illus="tasks" />
      <div className="mb-6"><Tabs value={f} onChange={setF} tabs={[
        { id: 'open', label: t('To do', 'للتنفيذ'), count: groups.open.length },
        { id: 'review', label: t('In review', 'قيد المراجعة'), count: groups.review.length },
        { id: 'overdue', label: t('Overdue', 'متأخرة'), count: groups.overdue.length },
        { id: 'done', label: t('Completed', 'مكتملة'), count: groups.done.length },
        { id: 'all', label: t('All', 'الكل'), count: all.length },
      ]} /></div>
      {q.loading ? <Spinner /> : !list.length ? <Empty icon={<ListChecks size={28} />} title={t('Nothing here', 'لا يوجد شيء هنا')} /> : <div className="space-y-2">{list.map((x) => <TaskRow key={x.id} task={x} onOpen={() => setOpen(x)} />)}</div>}
      {open && <TaskModal task={all.find((x) => x.id === open.id) ?? open} mode="mentee" onClose={() => setOpen(null)} onChanged={q.reload} />}
    </Page>
  );
}
