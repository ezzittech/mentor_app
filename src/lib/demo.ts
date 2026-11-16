/**
 * In-memory sample data used ONLY for "preview" (demo) sessions and when Supabase is not configured.
 * Nothing here is written to the database. Mutations during a demo session live until the page reloads.
 */
import type {
  Assessment, AuditLog, Category, Feedback, Goal, Intervention, Mentor, Mentorship, MentorshipRequest, Message, Milestone,
  Notification, Order, Package, Plan, Question, Resource, Review, Session, Skill, Submission, SupervisionNote, Task, UserRow,
} from './types';

const now = Date.now();
const day = 86400000;
const iso = (offsetDays: number, hour = 10) => { const d = new Date(now + offsetDays * day); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const date = (offsetDays: number) => iso(offsetDays).slice(0, 10);

export const categories: Category[] = [
  { id: 1, slug: 'engineering', name_en: 'Software Engineering', name_ar: 'هندسة البرمجيات', icon: 'Code2', color: 'indigo' },
  { id: 2, slug: 'data-ai', name_en: 'Data & AI', name_ar: 'البيانات والذكاء الاصطناعي', icon: 'BrainCircuit', color: 'purple' },
  { id: 3, slug: 'product', name_en: 'Product Management', name_ar: 'إدارة المنتجات', icon: 'Boxes', color: 'orange' },
  { id: 4, slug: 'design', name_en: 'UX / UI Design', name_ar: 'تصميم تجربة المستخدم', icon: 'PenTool', color: 'pink' },
  { id: 5, slug: 'leadership', name_en: 'Leadership', name_ar: 'القيادة والإدارة', icon: 'Crown', color: 'amber' },
  { id: 6, slug: 'career', name_en: 'Career Growth', name_ar: 'التطوير المهني', icon: 'TrendingUp', color: 'emerald' },
  { id: 7, slug: 'marketing', name_en: 'Marketing & Growth', name_ar: 'التسويق والنمو', icon: 'Megaphone', color: 'sky' },
  { id: 8, slug: 'business', name_en: 'Entrepreneurship', name_ar: 'ريادة الأعمال', icon: 'Rocket', color: 'red' },
];
const cat = (...ids: number[]) => categories.filter((c) => ids.includes(c.id));

export const skills: Skill[] = [
  'React', 'TypeScript', 'System Design', 'Python', 'Machine Learning', 'SQL', 'Product Strategy', 'Roadmapping', 'Figma',
  'User Research', 'Public Speaking', 'Team Leadership', 'Interview Prep', 'CV Review', 'SEO', 'Fundraising', 'Cloud / AWS', 'Data Analysis',
].map((name, i) => ({ id: i + 1, name, category_id: null }));

const pk = (id: number, mentor_id: string, name: string, price: number, calls: number, extra: Partial<Package> = {}): Package => ({
  id, mentor_id, name, description: null, price, currency: 'USD', billing: 'monthly', calls_per_month: calls, call_minutes: 45,
  chat_support: true, response_hours: 24, features: [], is_active: true, sort: id, trial_days: 7, ...extra,
});

type Seed = [id: string, name: string, headline: string, job: string, company: string, country: string, years: number, langs: string[], cats: number[], sk: string[], rating: number, reviews: number, mentees: number, price: number, featured?: boolean];
const SEED: Seed[] = [
  ['m-1', 'Omar Khalid', 'Staff Engineer helping developers reach senior level', 'Staff Software Engineer', 'Careem', 'United Arab Emirates', 12, ['ar', 'en'], [1, 6], ['System Design', 'React', 'TypeScript', 'Interview Prep'], 4.9, 86, 42, 180, true],
  ['m-2', 'Lina Haddad', 'Product lead — from idea to product-market fit', 'Head of Product', 'Talabat', 'Jordan', 10, ['ar', 'en', 'fr'], [3, 5], ['Product Strategy', 'Roadmapping', 'User Research'], 5.0, 64, 31, 220, true],
  ['m-3', 'Dr. Yousef Al-Amri', 'ML researcher & data science career coach', 'Principal Data Scientist', 'Aramco Digital', 'Saudi Arabia', 14, ['ar', 'en'], [2, 6], ['Machine Learning', 'Python', 'SQL', 'Data Analysis'], 4.8, 51, 25, 250, true],
  ['m-4', 'Maya Chen', 'Design leader building world-class UX teams', 'Design Director', 'Grab', 'Malaysia', 11, ['en'], [4, 5], ['Figma', 'User Research', 'Team Leadership'], 4.9, 73, 38, 200],
  ['m-5', 'Khaled Mansour', 'Engineering manager — first-time leaders & tech careers', 'Engineering Manager', 'Noon', 'Egypt', 9, ['ar', 'en'], [1, 5], ['Team Leadership', 'System Design', 'Cloud / AWS'], 4.7, 39, 19, 140],
  ['m-6', 'Noura Al-Saud', 'Career coach for women in tech & leadership', 'Career & Leadership Coach', 'Independent', 'Saudi Arabia', 8, ['ar', 'en'], [6, 5], ['CV Review', 'Interview Prep', 'Public Speaking'], 5.0, 92, 57, 120, true],
  ['m-7', 'James Walker', 'Growth marketer who scaled 3 startups to Series B', 'VP Growth', 'Deel', 'United Kingdom', 13, ['en'], [7, 8], ['SEO', 'Data Analysis', 'Product Strategy'], 4.8, 47, 22, 210],
  ['m-8', 'Rania Farouk', 'Founder mentor — fundraising, pitching & GTM', 'Founder & Angel Investor', 'Flat6Labs', 'Egypt', 15, ['ar', 'en'], [8, 3], ['Fundraising', 'Product Strategy', 'Public Speaking'], 4.9, 28, 14, 300],
  ['m-9', 'Ahmed Siddiqui', 'Cloud architect & AWS certification mentor', 'Solutions Architect', 'AWS', 'Pakistan', 10, ['en', 'ur'], [1], ['Cloud / AWS', 'System Design', 'Python'], 4.6, 33, 16, 110],
];

const BIO_AR = 'أعمل في المجال منذ أكثر من عشر سنوات، وساعدت عشرات المتدربين على الانتقال إلى أدوار أعلى. أؤمن أن الإرشاد الناجح يبدأ بهدف واضح وخطة قابلة للقياس ومتابعة أسبوعية صادقة. في جلساتنا سنحدد الفجوات، ونبني خطة تطوير، ونراجع تقدمك باستمرار.';
const BIO_EN = 'I have spent over a decade in the industry and helped dozens of mentees step into bigger roles. Good mentorship starts with a clear goal, a measurable plan and honest weekly follow-up. Together we will identify your gaps, build a development plan and review your progress continuously.';

export const mentors: Mentor[] = SEED.map(([id, full_name, headline, job_title, company, country, years, languages, cats, sk, rating, reviews, mentees, price, featured], i) => ({
  id, slug: full_name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''), full_name, avatar_url: null, headline,
  bio: languages.includes('ar') ? `${BIO_AR}\n\n${BIO_EN}` : BIO_EN, job_title, company, years_experience: years, country,
  timezone: 'Asia/Riyadh', languages, status: 'approved', is_published: true, featured: !!featured, accepting: i !== 7,
  rating_avg: rating, reviews_count: reviews, mentees_count: mentees, response_hours: [4, 8, 12, 24][i % 4], linkedin_url: 'https://linkedin.com',
  video_url: null, created_at: iso(-400 + i * 20), categories: cat(...cats), skills: sk, spots_left: [2, 1, 3, 4, 2, 1, 3, 0, 5][i],
  packages: [
    pk(i * 10 + 1, id, 'Lite', Math.round(price * 0.55), 1, { chat_support: true, response_hours: 48, features: ['Unlimited Q&A via chat', '1 call per month', 'Development plan'] }),
    pk(i * 10 + 2, id, 'Standard', price, 2, { features: ['Unlimited Q&A via chat', '2 calls per month', 'Development plan & tasks', 'Task reviews'] }),
    pk(i * 10 + 3, id, 'Pro', Math.round(price * 1.7), 4, { response_hours: 12, features: ['Priority chat', '4 calls per month', 'Plan, tasks & reviews', 'Hands-on support', 'CV & LinkedIn review'] }),
    pk(i * 10 + 4, id, 'Interview prep session', Math.round(price * 0.45), 1, { billing: 'one_off', call_minutes: 60, chat_support: false, trial_days: 0, features: ['60-minute mock interview', 'Written feedback'] }),
  ],
}));

export const users: UserRow[] = [
  { id: 'demo-mentee', full_name: 'Sara Al-Harbi', email: 'sara@example.com', avatar_url: null, headline: 'Frontend developer → aiming for senior', country: 'Saudi Arabia', timezone: 'Asia/Riyadh', locale: 'ar', bio: null, phone: null, is_active: true, created_at: iso(-60), roles: ['mentee'] },
  { id: 'u-2', full_name: 'Faisal Rahman', email: 'faisal@example.com', avatar_url: null, headline: 'Backend developer', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', locale: 'en', bio: null, phone: null, is_active: true, created_at: iso(-45), roles: ['mentee'] },
  { id: 'u-3', full_name: 'Mona Adel', email: 'mona@example.com', avatar_url: null, headline: 'Junior data analyst', country: 'Egypt', timezone: 'Africa/Cairo', locale: 'ar', bio: null, phone: null, is_active: true, created_at: iso(-30), roles: ['mentee'] },
  { id: 'u-4', full_name: 'Tariq Hussein', email: 'tariq@example.com', avatar_url: null, headline: 'CS graduate', country: 'Jordan', timezone: 'Asia/Amman', locale: 'ar', bio: null, phone: null, is_active: true, created_at: iso(-12), roles: ['mentee'] },
  { id: 'demo-supervisor', full_name: 'Huda Nasser', email: 'huda@example.com', avatar_url: null, headline: 'Program coordinator', country: 'Saudi Arabia', timezone: 'Asia/Riyadh', locale: 'ar', bio: null, phone: null, is_active: true, created_at: iso(-200), roles: ['supervisor'] },
  { id: 'demo-admin', full_name: 'Platform Admin', email: 'admin@example.com', avatar_url: null, headline: null, country: null, timezone: 'Asia/Riyadh', locale: 'ar', bio: null, phone: null, is_active: true, created_at: iso(-365), roles: ['admin'] },
  ...mentors.map((m) => ({ id: m.id, full_name: m.full_name, email: `${m.slug}@example.com`, avatar_url: null, headline: m.headline, country: m.country, timezone: m.timezone, locale: 'en' as const, bio: null, phone: null, is_active: true, created_at: m.created_at, roles: ['mentor' as const] })),
  { id: 'm-10', full_name: 'Hassan Qureshi', email: 'hassan@example.com', avatar_url: null, headline: 'iOS engineer (applied as mentor)', country: 'Qatar', timezone: 'Asia/Qatar', locale: 'en', bio: null, phone: null, is_active: true, created_at: iso(-3), roles: ['mentee', 'mentor'] },
];
export const pendingMentors: Mentor[] = [{ ...mentors[8], id: 'm-10', slug: 'hassan-qureshi', full_name: 'Hassan Qureshi', headline: 'Senior iOS engineer — Swift, app architecture & App Store launches', job_title: 'Senior iOS Engineer', company: 'Ooredoo', country: 'Qatar', status: 'pending', is_published: false, featured: false, rating_avg: 0, reviews_count: 0, mentees_count: 0, created_at: iso(-3) }];

const person = (id: string) => { const u = users.find((x) => x.id === id); return u ? { full_name: u.full_name, headline: u.headline, avatar_url: null, country: u.country } : null; };

export const requests: MentorshipRequest[] = [
  { id: 1, mentee_id: 'u-4', mentor_id: 'm-1', package_id: 2, goal: 'I want to land my first frontend job within 6 months and build a strong portfolio.', background: 'CS graduate, built 3 React side projects.', expectations: 'Weekly accountability and portfolio reviews.', status: 'submitted', decision_note: null, created_at: iso(-1), decided_at: null },
  { id: 2, mentee_id: 'u-3', mentor_id: 'm-1', package_id: 1, goal: 'Move from data analysis to analytics engineering.', background: '2 years as junior analyst.', expectations: null, status: 'under_review', decision_note: null, created_at: iso(-3), decided_at: null },
  { id: 3, mentee_id: 'demo-mentee', mentor_id: 'm-1', package_id: 2, goal: 'Reach senior frontend level: system design, code reviews and leading features.', background: '4 years React experience.', expectations: 'Structured plan + biweekly calls.', status: 'accepted', decision_note: 'Great fit — welcome aboard!', created_at: iso(-40), decided_at: iso(-39) },
  { id: 4, mentee_id: 'demo-mentee', mentor_id: 'm-6', package_id: 51, goal: 'Prepare for leadership interviews and improve public speaking.', background: null, expectations: null, status: 'submitted', decision_note: null, created_at: iso(-2), decided_at: null },
].map((r) => ({ ...r, status: r.status as MentorshipRequest['status'], mentee: person(r.mentee_id), mentor: (() => { const m = mentors.find((x) => x.id === r.mentor_id)!; return { full_name: m.full_name, slug: m.slug, headline: m.headline }; })(), package: (() => { const p = mentors.flatMap((m) => m.packages).find((p) => p.id === r.package_id); return p ? { name: p.name, price: p.price, currency: p.currency } : null; })() }));

export const mentorships: Mentorship[] = [
  { id: 1, mentee_id: 'demo-mentee', mentor_id: 'm-1', supervisor_id: 'demo-supervisor', package_id: 2, status: 'active', started_at: iso(-39), ended_at: null, last_activity_at: iso(-1) },
  { id: 2, mentee_id: 'u-2', mentor_id: 'm-1', supervisor_id: 'demo-supervisor', package_id: 3, status: 'active', started_at: iso(-30), ended_at: null, last_activity_at: iso(-12) },
  { id: 3, mentee_id: 'u-3', mentor_id: 'm-3', supervisor_id: 'demo-supervisor', package_id: 22, status: 'paused', started_at: iso(-80), ended_at: null, last_activity_at: iso(-20) },
  { id: 4, mentee_id: 'u-4', mentor_id: 'm-2', supervisor_id: null, package_id: 12, status: 'pending_setup', started_at: iso(-2), ended_at: null, last_activity_at: iso(-2) },
].map((m) => ({ ...m, status: m.status as Mentorship['status'], mentee: person(m.mentee_id), mentor: person(m.mentor_id), supervisor: m.supervisor_id ? { full_name: person(m.supervisor_id)!.full_name } : null, package: { name: mentors.flatMap((x) => x.packages).find((p) => p.id === m.package_id)?.name ?? '' } }));

export const questions: Question[] = [
  { id: 1, template_id: 1, section: 'goal', kind: 'single', prompt_en: 'What is your main goal right now?', prompt_ar: 'ما هدفك الرئيسي حاليًا؟', required: true, sort: 1, options: [{ en: 'Grow in my current role', ar: 'التطور في دوري الحالي' }, { en: 'Change career path', ar: 'تغيير المسار المهني' }, { en: 'Get my first job', ar: 'الحصول على أول وظيفة' }, { en: 'Become a leader / manager', ar: 'الانتقال إلى القيادة والإدارة' }, { en: 'Start or grow a business', ar: 'بدء مشروع أو تنميته' }] },
  { id: 2, template_id: 1, section: 'goal', kind: 'long', prompt_en: 'Describe the goal in your own words. What does success look like in 6 months?', prompt_ar: 'صف هدفك بكلماتك. كيف يبدو النجاح بعد 6 أشهر؟', required: true, sort: 2, options: null },
  { id: 3, template_id: 1, section: 'background', kind: 'single', prompt_en: 'How many years of relevant experience do you have?', prompt_ar: 'كم سنة خبرة لديك في المجال؟', required: true, sort: 3, options: [{ en: 'None yet', ar: 'لا يوجد بعد' }, { en: '< 2 years', ar: 'أقل من سنتين' }, { en: '2–5 years', ar: '2–5 سنوات' }, { en: '5–10 years', ar: '5–10 سنوات' }, { en: '10+ years', ar: 'أكثر من 10 سنوات' }] },
  { id: 4, template_id: 1, section: 'background', kind: 'scale', prompt_en: 'Rate your current level in your target area (1–5)', prompt_ar: 'قيّم مستواك الحالي في المجال المستهدف (1–5)', required: true, sort: 4, options: null },
  { id: 5, template_id: 1, section: 'background', kind: 'long', prompt_en: 'Previous projects or achievements you are proud of', prompt_ar: 'مشاريع أو إنجازات سابقة تفخر بها', required: false, sort: 5, options: null },
  { id: 6, template_id: 1, section: 'gaps', kind: 'multi', prompt_en: 'Which areas do you want to strengthen?', prompt_ar: 'ما المجالات التي تريد تقويتها؟', required: true, sort: 6, options: [{ en: 'Technical skills', ar: 'المهارات التقنية' }, { en: 'Communication', ar: 'التواصل' }, { en: 'Leadership', ar: 'القيادة' }, { en: 'Interviewing', ar: 'المقابلات' }, { en: 'Networking & personal brand', ar: 'العلاقات والعلامة الشخصية' }, { en: 'Time management', ar: 'إدارة الوقت' }] },
  { id: 7, template_id: 1, section: 'gaps', kind: 'long', prompt_en: 'What are your strengths?', prompt_ar: 'ما نقاط قوتك؟', required: false, sort: 7, options: null },
  { id: 8, template_id: 1, section: 'logistics', kind: 'single', prompt_en: 'Weekly time you can dedicate', prompt_ar: 'الوقت الأسبوعي المتاح', required: true, sort: 8, options: [{ en: '1–2 hours', ar: '1–2 ساعة' }, { en: '3–5 hours', ar: '3–5 ساعات' }, { en: '6–10 hours', ar: '6–10 ساعات' }, { en: '10+ hours', ar: 'أكثر من 10 ساعات' }] },
  { id: 9, template_id: 1, section: 'logistics', kind: 'date', prompt_en: 'Target date to reach your goal', prompt_ar: 'التاريخ المستهدف لتحقيق هدفك', required: false, sort: 9, options: null },
];

export const assessments: Assessment[] = [
  { id: 1, mentee_id: 'demo-mentee', template_id: 1, kind: 'initial', status: 'reviewed', submitted_at: iso(-41), review_note: 'Clear goal, strong React base. Focus on system design and leadership.', answers: { 1: 0, 2: 'Become a senior frontend engineer leading features end-to-end.', 3: 2, 4: 3, 6: [0, 2], 8: 1, 9: date(150) } },
];

export const plans: Plan[] = [
  { id: 1, mentorship_id: 1, mentee_id: 'demo-mentee', mentor_id: 'm-1', title: 'Path to Senior Frontend Engineer', summary: 'A 5-month plan focused on system design, code quality leadership and visible impact at work.', status: 'active', start_date: date(-38), target_date: date(115), approved_at: iso(-36), version: 2, created_at: iso(-38) },
  { id: 2, mentorship_id: 2, mentee_id: 'u-2', mentor_id: 'm-1', title: 'Backend → Cloud-native architecture', summary: 'Strengthen distributed systems & AWS fundamentals.', status: 'active', start_date: date(-29), target_date: date(90), approved_at: iso(-27), version: 1, created_at: iso(-29) },
];

export const goals: Goal[] = [
  { id: 1, plan_id: 1, title: 'Master frontend system design', description: 'Design scalable frontend architectures and explain trade-offs.', rationale: 'Main gap identified in the assessment.', baseline: 'Can build features, struggles with architecture discussions', target: 'Lead 2 design reviews at work', success_criteria: '2 design docs approved by the team', priority: 'high', status: 'in_progress', due_date: date(40), sort: 1 },
  { id: 2, plan_id: 1, title: 'Lead code quality in the team', description: 'Own code-review standards and mentor juniors.', rationale: 'Seniors are expected to multiply the team.', baseline: 'Reviews ~3 PRs/week', target: 'Review 10 PRs/week and run 1 knowledge session', success_criteria: 'Team adopts review checklist', priority: 'medium', status: 'in_progress', due_date: date(75), sort: 2 },
  { id: 3, plan_id: 1, title: 'Build a visible track record', description: 'Write about your work and present it.', rationale: 'Promotion needs evidence.', baseline: 'No public writing', target: '2 blog posts + 1 internal talk', success_criteria: 'Published posts', priority: 'low', status: 'not_started', due_date: date(110), sort: 3 },
  { id: 4, plan_id: 2, title: 'AWS Solutions Architect Associate', description: null, rationale: null, baseline: null, target: 'Pass certification', success_criteria: 'Certificate', priority: 'high', status: 'in_progress', due_date: date(50), sort: 1 },
];

export const milestones: Milestone[] = [
  { id: 1, plan_id: 1, goal_id: 1, title: 'First design doc drafted', due_date: date(-5), done: true },
  { id: 2, plan_id: 1, goal_id: 1, title: 'Design review presented', due_date: date(20), done: false },
  { id: 3, plan_id: 1, goal_id: 2, title: 'Review checklist adopted', due_date: date(45), done: false },
];

export const tasks: Task[] = [
  { id: 1, plan_id: 1, goal_id: 1, title: 'Read: Frontend architecture patterns', description: 'Read the 3 articles linked and write a one-page summary of the trade-offs.', kind: 'resource', status: 'completed', due_date: date(-20), resource_url: 'https://web.dev/', created_at: iso(-36), updated_at: iso(-22) },
  { id: 2, plan_id: 1, goal_id: 1, title: 'Design doc: real-time notifications', description: 'Write a design doc for a real-time notification center (state, caching, offline).', kind: 'project', status: 'submitted', due_date: date(-2), resource_url: null, created_at: iso(-20), updated_at: iso(-1) },
  { id: 3, plan_id: 1, goal_id: 1, title: 'Mock system design interview', description: 'Prepare for a 45-minute mock with your mentor.', kind: 'session', status: 'not_started', due_date: date(6), resource_url: null, created_at: iso(-10), updated_at: iso(-10) },
  { id: 4, plan_id: 1, goal_id: 2, title: 'Draft a code-review checklist', description: 'Create a checklist and share it with your team for feedback.', kind: 'exercise', status: 'changes_requested', due_date: date(3), resource_url: null, created_at: iso(-15), updated_at: iso(-4) },
  { id: 5, plan_id: 1, goal_id: 2, title: 'Run a knowledge-sharing session', description: '30-minute talk on testing strategies.', kind: 'project', status: 'in_progress', due_date: date(14), resource_url: null, created_at: iso(-8), updated_at: iso(-3) },
  { id: 6, plan_id: 1, goal_id: 3, title: 'Outline your first blog post', description: null, kind: 'exercise', status: 'not_started', due_date: date(30), resource_url: null, created_at: iso(-5), updated_at: iso(-5) },
  { id: 7, plan_id: 1, goal_id: 1, title: 'Self-review: architecture trade-offs', description: 'Reflect on the last design discussion you joined.', kind: 'review', status: 'not_started', due_date: date(-4), resource_url: null, created_at: iso(-12), updated_at: iso(-12) },
  { id: 8, plan_id: 2, goal_id: 4, title: 'Complete VPC & networking module', description: null, kind: 'resource', status: 'submitted', due_date: date(-1), resource_url: 'https://aws.amazon.com/training/', created_at: iso(-10), updated_at: iso(-1) },
];

export const submissions: Submission[] = [
  { id: 1, task_id: 2, author_id: 'demo-mentee', body: 'Here is my design doc. I chose a WebSocket channel with a local cache and optimistic read-state.', link_url: 'https://docs.google.com/', created_at: iso(-1), author: { full_name: 'Sara Al-Harbi' } },
  { id: 2, task_id: 4, author_id: 'demo-mentee', body: 'First version of the checklist.', link_url: null, created_at: iso(-6), author: { full_name: 'Sara Al-Harbi' } },
  { id: 3, task_id: 8, author_id: 'u-2', body: 'Finished the module and labs.', link_url: null, created_at: iso(-1), author: { full_name: 'Faisal Rahman' } },
];
export const feedback: Feedback[] = [
  { id: 1, task_id: 4, author_id: 'm-1', body: 'Good start! Group the items by severity and add examples for each.', decision: 'changes_requested', created_at: iso(-4), author: { full_name: 'Omar Khalid' } },
  { id: 2, task_id: 1, author_id: 'm-1', body: 'Excellent summary — you clearly understood the trade-offs.', decision: 'approved', created_at: iso(-22), author: { full_name: 'Omar Khalid' } },
];

export const resources: Resource[] = [
  { id: 1, plan_id: 1, goal_id: 1, title: 'Frontend System Design guide', url: 'https://www.greatfrontend.com/', kind: 'course', provider: 'GreatFrontEnd', done: true },
  { id: 2, plan_id: 1, goal_id: 1, title: 'Patterns.dev', url: 'https://www.patterns.dev/', kind: 'book', provider: 'patterns.dev', done: false },
  { id: 3, plan_id: 1, goal_id: 2, title: 'Google engineering practices — code review', url: 'https://google.github.io/eng-practices/', kind: 'article', provider: 'Google', done: false },
  { id: 4, plan_id: 1, goal_id: 3, title: 'Technical writing course', url: 'https://developers.google.com/tech-writing', kind: 'course', provider: 'Google', done: false },
];

export const sessions: Session[] = [
  { id: 1, mentorship_id: 1, mentee_id: 'demo-mentee', mentor_id: 'm-1', goal_id: 1, title: 'Mock system design interview', starts_at: iso(2, 18), duration_min: 45, timezone: 'Asia/Riyadh', status: 'confirmed', meeting_url: 'https://meet.google.com/', agenda: 'Design a news feed. 10 min requirements, 25 min design, 10 min feedback.', shared_notes: null, created_at: iso(-5) },
  { id: 2, mentorship_id: 1, mentee_id: 'demo-mentee', mentor_id: 'm-1', goal_id: 2, title: 'Checklist review & leadership talk', starts_at: iso(9, 18), duration_min: 45, timezone: 'Asia/Riyadh', status: 'scheduled', meeting_url: null, agenda: null, shared_notes: null, created_at: iso(-2) },
  { id: 3, mentorship_id: 1, mentee_id: 'demo-mentee', mentor_id: 'm-1', goal_id: null, title: 'Kick-off & plan review', starts_at: iso(-36, 18), duration_min: 45, timezone: 'Asia/Riyadh', status: 'completed', meeting_url: null, agenda: null, shared_notes: 'Agreed on 3 goals. Next: first design doc.', created_at: iso(-38) },
  { id: 4, mentorship_id: 1, mentee_id: 'demo-mentee', mentor_id: 'm-1', goal_id: 1, title: 'Design doc walkthrough', starts_at: iso(-14, 18), duration_min: 45, timezone: 'Asia/Riyadh', status: 'completed', meeting_url: null, agenda: null, shared_notes: 'Good structure — add failure modes section.', created_at: iso(-16) },
  { id: 5, mentorship_id: 2, mentee_id: 'u-2', mentor_id: 'm-1', goal_id: 4, title: 'AWS networking deep-dive', starts_at: iso(1, 15), duration_min: 60, timezone: 'Asia/Kuala_Lumpur', status: 'confirmed', meeting_url: 'https://zoom.us/', agenda: null, shared_notes: null, created_at: iso(-3) },
  { id: 6, mentorship_id: 2, mentee_id: 'u-2', mentor_id: 'm-1', goal_id: null, title: 'Monthly check-in', starts_at: iso(-10, 15), duration_min: 30, timezone: 'Asia/Kuala_Lumpur', status: 'no_show', meeting_url: null, agenda: null, shared_notes: null, created_at: iso(-12) },
].map((s) => ({ ...s, status: s.status as Session['status'], mentee: { full_name: person(s.mentee_id)!.full_name }, mentor: { full_name: person(s.mentor_id)!.full_name } }));

export const messages: Message[] = [
  { id: 1, mentorship_id: 1, sender_id: 'm-1', body: 'مرحبًا سارة! راجعت مستند التصميم، عمل رائع 👏', created_at: iso(-1, 9), read_at: iso(-1, 10) },
  { id: 2, mentorship_id: 1, sender_id: 'demo-mentee', body: 'شكرًا جزيلًا! هل يمكننا مناقشة قسم التخزين المؤقت في الجلسة القادمة؟', created_at: iso(-1, 10), read_at: iso(-1, 11) },
  { id: 3, mentorship_id: 1, sender_id: 'm-1', body: 'Absolutely. Also try to add a section on failure modes before Thursday.', created_at: iso(-1, 11), read_at: null },
  { id: 4, mentorship_id: 2, sender_id: 'u-2', body: 'Finished the VPC module, submitted for review.', created_at: iso(-1, 14), read_at: null },
];

export const notes: SupervisionNote[] = [
  { id: 1, mentorship_id: 2, author_id: 'demo-supervisor', body: 'Missed the monthly check-in. Sent a reminder and asked mentor to reschedule.', visibility: 'staff', created_at: iso(-9), author: { full_name: 'Huda Nasser' } },
  { id: 2, mentorship_id: 1, author_id: 'demo-supervisor', body: 'Excellent momentum — on track for the first milestone.', visibility: 'mentee', created_at: iso(-6), author: { full_name: 'Huda Nasser' } },
];
export const interventions: Intervention[] = [
  { id: 1, mentorship_id: 2, author_id: 'demo-supervisor', kind: 'reschedule', note: 'Asked to reschedule missed check-in.', status: 'open', created_at: iso(-9) },
  { id: 2, mentorship_id: 3, author_id: 'demo-supervisor', kind: 'escalation', note: 'No activity for 20 days — mentorship paused by mentee.', status: 'open', created_at: iso(-5) },
];

export const reviews: Review[] = [
  ['Ahmad S.', 'Frontend Engineer', 5, 'Omar helped me structure my learning and I got promoted to senior in 5 months. The plan + weekly check-ins were a game changer.'],
  ['Reem T.', 'Product Designer', 5, 'تجربة رائعة! خطة واضحة ومتابعة مستمرة، وأصبحت أكثر ثقة في المقابلات.'],
  ['Daniel K.', 'Software Engineer', 5, 'The mock system design interviews were incredibly realistic. Landed an offer at a top company.'],
  ['Nada M.', 'Data Analyst', 4, 'Very knowledgeable and patient. The tasks were practical and directly useful in my job.'],
  ['Yazan A.', 'Team Lead', 5, 'ساعدني على الانتقال إلى دور قيادي بخطة عملية ومهام قابلة للقياس.'],
  ['Priya R.', 'Product Manager', 5, 'Honest feedback, sharp questions and great resources. Worth every cent.'],
].map(([n, h, rating, comment], i) => ({ id: i + 1, mentorship_id: 100 + i, mentee_id: `r-${i}`, mentor_id: mentors[i % 3].id, rating: rating as number, comment: comment as string, is_public: true, created_at: iso(-10 - i * 9), mentee: { full_name: n as string, headline: h as string } }));

export const orders: Order[] = [
  { id: 1001, mentee_id: 'demo-mentee', mentor_id: 'm-1', package_id: 2, mentorship_id: 1, amount: 180, currency: 'USD', commission_rate: 0.15, commission_amount: 27, status: 'paid', provider: 'manual', created_at: iso(-39) },
  { id: 1002, mentee_id: 'demo-mentee', mentor_id: 'm-1', package_id: 2, mentorship_id: 1, amount: 180, currency: 'USD', commission_rate: 0.15, commission_amount: 27, status: 'paid', provider: 'manual', created_at: iso(-9) },
  { id: 1003, mentee_id: 'u-2', mentor_id: 'm-1', package_id: 3, mentorship_id: 2, amount: 306, currency: 'USD', commission_rate: 0.15, commission_amount: 45.9, status: 'paid', provider: 'manual', created_at: iso(-30) },
  { id: 1004, mentee_id: 'u-3', mentor_id: 'm-3', package_id: 22, mentorship_id: 3, amount: 250, currency: 'USD', commission_rate: 0.15, commission_amount: 37.5, status: 'refunded', provider: 'manual', created_at: iso(-75) },
  { id: 1005, mentee_id: 'u-4', mentor_id: 'm-2', package_id: 12, mentorship_id: 4, amount: 220, currency: 'USD', commission_rate: 0.15, commission_amount: 33, status: 'pending', provider: 'manual', created_at: iso(-2) },
].map((o) => ({ ...o, status: o.status as Order['status'], mentee: { full_name: person(o.mentee_id)!.full_name }, mentor: { full_name: person(o.mentor_id)!.full_name }, package: { name: mentors.flatMap((m) => m.packages).find((p) => p.id === o.package_id)?.name ?? '' } }));

export const notifications: Notification[] = [
  { id: 1, user_id: '*', title: 'New feedback on your task', body: 'Code-review checklist: changes requested', link: '/app/mentee/tasks', read: false, created_at: iso(-0.2) },
  { id: 2, user_id: '*', title: 'Session confirmed', body: 'Mock system design interview — in 2 days', link: '/app/mentee/sessions', read: false, created_at: iso(-1) },
  { id: 3, user_id: '*', title: 'Plan approved', body: 'Path to Senior Frontend Engineer is now active', link: '/app/mentee/plan', read: true, created_at: iso(-36) },
];

export const auditLogs: AuditLog[] = [
  { id: 1, actor_id: 'demo-admin', action: 'mentor.approved', entity: 'mentor_profiles', entity_id: 'm-9', data: null, created_at: iso(-20), actor: { full_name: 'Platform Admin' } },
  { id: 2, actor_id: 'm-1', action: 'request.accepted', entity: 'mentorship_requests', entity_id: '3', data: null, created_at: iso(-39), actor: { full_name: 'Omar Khalid' } },
  { id: 3, actor_id: 'demo-admin', action: 'role.granted', entity: 'user_roles', entity_id: 'demo-supervisor', data: { role: 'supervisor' }, created_at: iso(-60), actor: { full_name: 'Platform Admin' } },
  { id: 4, actor_id: 'demo-admin', action: 'order.refunded', entity: 'orders', entity_id: '1004', data: { amount: 250 }, created_at: iso(-70), actor: { full_name: 'Platform Admin' } },
  { id: 5, actor_id: 'demo-admin', action: 'settings.updated', entity: 'system_settings', entity_id: 'commission_rate', data: { value: 0.15 }, created_at: iso(-90), actor: { full_name: 'Platform Admin' } },
];

export const settings: Record<string, unknown> = { commission_rate: 0.15, default_currency: 'USD', trial_days: 7, payments_enabled: false, meeting_provider: 'manual', supervisor_can_read_messages: false };

let seq = 5000;
export const nextId = () => ++seq;
