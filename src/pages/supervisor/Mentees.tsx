import { Page, PageHero } from '../../components/ui';
import { MentorshipList } from '../mentor/Mentees';
import { useT } from '../../lib/i18n';

export default function SupervisorMentees() {
  const t = useT();
  return <Page><PageHero badge={t('Supervision', 'الإشراف')} badgeColor="amber" title={t('Assigned mentees', 'المتدربون المسندون')} subtitle={t('Open a mentee to view their plan, sessions and log supervision notes.', 'افتح ملف المتدرب لعرض خطته وجلساته وتسجيل الملاحظات الإشرافية.')} illus="mentors" /><MentorshipList base="/app/supervisor/mentees" role="supervisor" /></Page>;
}
