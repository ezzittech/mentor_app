import {
  BarChart3, BookOpenCheck, CalendarClock, ClipboardList, Coins, FolderKanban, Gauge, Inbox, LayoutDashboard,
  ListChecks, MessagesSquare, Route, ScrollText, Settings2, ShieldCheck, Star, Tags, UserCog, UserRoundCheck, Users,
  Wallet, type LucideIcon,
} from 'lucide-react';
import type { Role } from './types';

export type NavItem = { to: string; en: string; ar: string; icon: LucideIcon; end?: boolean };
export type NavGroup = { en: string; ar: string; items: NavItem[] };

export const ROLE_LABEL: Record<Role, { en: string; ar: string }> = {
  mentee: { en: 'Mentee', ar: 'متدرب' },
  mentor: { en: 'Mentor', ar: 'مرشد' },
  supervisor: { en: 'Supervisor', ar: 'مشرف' },
  program_manager: { en: 'Program Manager', ar: 'مدير برنامج' },
  admin: { en: 'Administrator', ar: 'مسؤول النظام' },
  support: { en: 'Support', ar: 'الدعم' },
};

export const ROLE_HOME: Record<Role, string> = {
  mentee: '/app/mentee',
  mentor: '/app/mentor',
  supervisor: '/app/supervisor',
  program_manager: '/app/supervisor',
  admin: '/app/admin',
  support: '/app/admin/users',
};

const shared: NavItem[] = [
  { to: '/app/messages', en: 'Messages', ar: 'الرسائل', icon: MessagesSquare },
  { to: '/app/profile', en: 'Account settings', ar: 'إعدادات الحساب', icon: UserCog },
];

export const NAV: Record<Role, NavGroup[]> = {
  mentee: [
    { en: 'My journey', ar: 'رحلتي', items: [
      { to: '/app/mentee', en: 'Dashboard', ar: 'لوحة التحكم', icon: LayoutDashboard, end: true },
      { to: '/app/mentee/assessment', en: 'Assessment', ar: 'التقييم الأولي', icon: ClipboardList },
      { to: '/app/mentee/plan', en: 'Development plan', ar: 'خطة التطوير', icon: Route },
      { to: '/app/mentee/tasks', en: 'Tasks', ar: 'المهام', icon: ListChecks },
      { to: '/app/mentee/sessions', en: 'Sessions', ar: 'الجلسات', icon: CalendarClock },
    ] },
    { en: 'Mentorship', ar: 'الإرشاد', items: [
      { to: '/app/mentee/mentors', en: 'My mentors', ar: 'مرشدوني', icon: UserRoundCheck },
      { to: '/app/mentee/payments', en: 'Payments', ar: 'المدفوعات', icon: Wallet },
      ...shared,
    ] },
  ],
  mentor: [
    { en: 'Workspace', ar: 'مساحة العمل', items: [
      { to: '/app/mentor', en: 'Dashboard', ar: 'لوحة التحكم', icon: LayoutDashboard, end: true },
      { to: '/app/mentor/applications', en: 'Applications', ar: 'طلبات الإرشاد', icon: Inbox },
      { to: '/app/mentor/mentees', en: 'My mentees', ar: 'متدربيّ', icon: Users },
      { to: '/app/mentor/reviews', en: 'Submissions', ar: 'تسليمات للمراجعة', icon: BookOpenCheck },
      { to: '/app/mentor/sessions', en: 'Sessions', ar: 'الجلسات', icon: CalendarClock },
    ] },
    { en: 'My business', ar: 'نشاطي', items: [
      { to: '/app/mentor/profile', en: 'Profile & plans', ar: 'الملف والباقات', icon: Star },
      { to: '/app/mentor/earnings', en: 'Earnings', ar: 'الأرباح', icon: Coins },
      ...shared,
    ] },
  ],
  supervisor: [
    { en: 'Supervision', ar: 'الإشراف', items: [
      { to: '/app/supervisor', en: 'Dashboard', ar: 'لوحة المتابعة', icon: Gauge, end: true },
      { to: '/app/supervisor/mentees', en: 'Assigned mentees', ar: 'المتدربون المسندون', icon: Users },
      ...shared,
    ] },
  ],
  program_manager: [
    { en: 'Programs', ar: 'البرامج', items: [
      { to: '/app/supervisor', en: 'Dashboard', ar: 'لوحة المتابعة', icon: Gauge, end: true },
      { to: '/app/supervisor/mentees', en: 'Participants', ar: 'المشاركون', icon: Users },
      ...shared,
    ] },
  ],
  admin: [
    { en: 'Overview', ar: 'نظرة عامة', items: [
      { to: '/app/admin', en: 'Dashboard', ar: 'لوحة الإدارة', icon: BarChart3, end: true },
      { to: '/app/admin/users', en: 'Users & roles', ar: 'المستخدمون والأدوار', icon: ShieldCheck },
      { to: '/app/admin/mentors', en: 'Mentor approvals', ar: 'اعتماد المرشدين', icon: UserRoundCheck },
      { to: '/app/admin/mentorships', en: 'Mentorships', ar: 'علاقات الإرشاد', icon: FolderKanban },
    ] },
    { en: 'Configuration', ar: 'الإعدادات', items: [
      { to: '/app/admin/taxonomy', en: 'Categories & skills', ar: 'التصنيفات والمهارات', icon: Tags },
      { to: '/app/admin/finance', en: 'Payments & commission', ar: 'المدفوعات والعمولات', icon: Wallet },
      { to: '/app/admin/settings', en: 'Platform settings', ar: 'إعدادات المنصة', icon: Settings2 },
      { to: '/app/admin/audit', en: 'Audit log', ar: 'سجل التدقيق', icon: ScrollText },
      ...shared,
    ] },
  ],
  support: [
    { en: 'Support', ar: 'الدعم', items: [
      { to: '/app/admin/users', en: 'Users', ar: 'المستخدمون', icon: ShieldCheck },
      ...shared,
    ] },
  ],
};
