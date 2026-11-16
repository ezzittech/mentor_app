import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Empty, Page, PageHero, Spinner, btnAccent } from '../../components/ui';
import { PlanBoard } from '../../components/plan';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useT } from '../../lib/i18n';

export default function MenteePlan() {
  const t = useT();
  const q = useAsync(async () => { const ms = await api.currentMentorship(); return { ms, bundle: ms ? await api.planForMentorship(ms.id) : null }; });
  return (
    <Page>
      <PageHero badge={t('Development plan', 'خطة التطوير')} title={t('Your personal plan', 'خطتك الشخصية')} subtitle={t('Goals, milestones, tasks and resources agreed with your mentor. Every change is recorded.', 'الأهداف والمراحل والمهام والمصادر المتفق عليها مع مرشدك، وكل تعديل مُسجّل.')} illus="plan" />
      {q.loading || !q.data ? <Spinner /> : !q.data.ms ? (
        <Empty icon={<Search size={28} />} title={t('You don’t have a mentor yet', 'ليس لديك مرشد بعد')} text={t('Your plan is built together with your mentor.', 'تُبنى خطتك بالتعاون مع مرشدك.')} action={<Link to="/mentors" className={btnAccent}>{t('Find a mentor', 'ابحث عن مرشد')}</Link>} />
      ) : <PlanBoard bundle={q.data.bundle!} mode="mentee" mentorshipId={q.data.ms.id} reload={q.reload} />}
    </Page>
  );
}
