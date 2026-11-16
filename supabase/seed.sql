-- Reference data (safe for production): categories, skills, the initial assessment and default settings.
-- Run AFTER migrations/0001_init.sql. Re-runnable.

insert into public.system_settings (key, value) values
  ('commission_rate', '0.15'), ('default_currency', '"USD"'), ('trial_days', '7'),
  ('payments_enabled', 'false'), ('meeting_provider', '"manual"'), ('supervisor_can_read_messages', 'false')
on conflict (key) do nothing;

insert into public.categories (slug, name_en, name_ar, icon, color, sort) values
  ('engineering', 'Software Engineering', 'هندسة البرمجيات', 'Code2', 'indigo', 1),
  ('data-ai', 'Data & AI', 'البيانات والذكاء الاصطناعي', 'BrainCircuit', 'purple', 2),
  ('product', 'Product Management', 'إدارة المنتجات', 'Boxes', 'orange', 3),
  ('design', 'UX / UI Design', 'تصميم تجربة المستخدم', 'PenTool', 'pink', 4),
  ('leadership', 'Leadership', 'القيادة والإدارة', 'Crown', 'amber', 5),
  ('career', 'Career Growth', 'التطوير المهني', 'TrendingUp', 'emerald', 6),
  ('marketing', 'Marketing & Growth', 'التسويق والنمو', 'Megaphone', 'sky', 7),
  ('business', 'Entrepreneurship', 'ريادة الأعمال', 'Rocket', 'red', 8)
on conflict (slug) do nothing;

insert into public.skills (name) select unnest(array['React','TypeScript','System Design','Python','Machine Learning','SQL','Product Strategy','Roadmapping','Figma',
  'User Research','Public Speaking','Team Leadership','Interview Prep','CV Review','SEO','Fundraising','Cloud / AWS','Data Analysis'])
on conflict (name) do nothing;

do $$
declare t bigint;
begin
  if exists (select 1 from public.assessment_templates where kind = 'initial') then return; end if;
  insert into public.assessment_templates (title, kind) values ('Initial assessment', 'initial') returning id into t;
  insert into public.assessment_questions (template_id, section, kind, prompt_en, prompt_ar, options, required, sort) values
  (t, 'goal', 'single', 'What is your main goal right now?', 'ما هدفك الرئيسي حاليًا؟', '[{"en":"Grow in my current role","ar":"التطور في دوري الحالي"},{"en":"Change career path","ar":"تغيير المسار المهني"},{"en":"Get my first job","ar":"الحصول على أول وظيفة"},{"en":"Become a leader / manager","ar":"الانتقال إلى القيادة والإدارة"},{"en":"Start or grow a business","ar":"بدء مشروع أو تنميته"}]', true, 1),
  (t, 'goal', 'long', 'Describe the goal in your own words. What does success look like in 6 months?', 'صف هدفك بكلماتك. كيف يبدو النجاح بعد 6 أشهر؟', null, true, 2),
  (t, 'background', 'single', 'How many years of relevant experience do you have?', 'كم سنة خبرة لديك في المجال؟', '[{"en":"None yet","ar":"لا يوجد بعد"},{"en":"< 2 years","ar":"أقل من سنتين"},{"en":"2–5 years","ar":"2–5 سنوات"},{"en":"5–10 years","ar":"5–10 سنوات"},{"en":"10+ years","ar":"أكثر من 10 سنوات"}]', true, 3),
  (t, 'background', 'scale', 'Rate your current level in your target area (1–5)', 'قيّم مستواك الحالي في المجال المستهدف (1–5)', null, true, 4),
  (t, 'background', 'long', 'Previous projects or achievements you are proud of', 'مشاريع أو إنجازات سابقة تفخر بها', null, false, 5),
  (t, 'gaps', 'multi', 'Which areas do you want to strengthen?', 'ما المجالات التي تريد تقويتها؟', '[{"en":"Technical skills","ar":"المهارات التقنية"},{"en":"Communication","ar":"التواصل"},{"en":"Leadership","ar":"القيادة"},{"en":"Interviewing","ar":"المقابلات"},{"en":"Networking & personal brand","ar":"العلاقات والعلامة الشخصية"},{"en":"Time management","ar":"إدارة الوقت"}]', true, 6),
  (t, 'gaps', 'long', 'What are your strengths?', 'ما نقاط قوتك؟', null, false, 7),
  (t, 'logistics', 'single', 'Weekly time you can dedicate', 'الوقت الأسبوعي المتاح', '[{"en":"1–2 hours","ar":"1–2 ساعة"},{"en":"3–5 hours","ar":"3–5 ساعات"},{"en":"6–10 hours","ar":"6–10 ساعات"},{"en":"10+ hours","ar":"أكثر من 10 ساعات"}]', true, 8),
  (t, 'logistics', 'date', 'Target date to reach your goal', 'التاريخ المستهدف لتحقيق هدفك', null, false, 9);
end $$;
