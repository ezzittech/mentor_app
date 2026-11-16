import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import PortalLayout from './components/layout/PortalLayout';
import { Spinner, Toaster } from './components/ui';
import { useAuth } from './lib/auth';
import { ROLE_HOME } from './lib/nav';
import type { Role } from './lib/types';

const L = (f: () => Promise<{ default: ComponentType }>) => lazy(f);
const N = <K extends string>(f: () => Promise<Record<K, ComponentType>>, k: K) => lazy(() => f().then((m) => ({ default: m[k] })));

// Public
const Home = L(() => import('./pages/public/Home'));
const Mentors = L(() => import('./pages/public/Mentors'));
const MentorProfile = L(() => import('./pages/public/MentorProfile'));
const HowItWorks = L(() => import('./pages/public/HowItWorks'));
const Pricing = L(() => import('./pages/public/Pricing'));
const BecomeMentor = L(() => import('./pages/public/BecomeMentor'));
const Login = L(() => import('./pages/public/Login'));
const Register = L(() => import('./pages/public/Register'));
const ForgotPassword = N(() => import('./pages/public/ForgotPassword'), 'ForgotPassword');
const ResetPassword = N(() => import('./pages/public/ForgotPassword'), 'ResetPassword');
// Shared
const Messages = L(() => import('./pages/shared/Messages'));
const Account = L(() => import('./pages/shared/Account'));
// Mentee
const MenteeDashboard = L(() => import('./pages/mentee/Dashboard'));
const Assessment = L(() => import('./pages/mentee/Assessment'));
const MenteePlan = L(() => import('./pages/mentee/Plan'));
const MenteeTasks = L(() => import('./pages/mentee/Tasks'));
const Sessions = lazy(() => import('./pages/shared/Sessions'));
const MyMentors = L(() => import('./pages/mentee/MyMentors'));
const Payments = L(() => import('./pages/mentee/Payments'));
// Mentor
const MentorDashboard = L(() => import('./pages/mentor/Dashboard'));
const Applications = L(() => import('./pages/mentor/Applications'));
const MyMentees = L(() => import('./pages/mentor/Mentees'));
const MentorshipDetail = lazy(() => import('./pages/shared/MentorshipDetail'));
const ReviewQueue = L(() => import('./pages/mentor/ReviewQueue'));
const MentorProfileEditor = L(() => import('./pages/mentor/ProfileEditor'));
const Earnings = L(() => import('./pages/mentor/Earnings'));
// Supervisor
const SupervisorDashboard = L(() => import('./pages/supervisor/Dashboard'));
const SupervisorMentees = L(() => import('./pages/supervisor/Mentees'));
// Admin
const AdminDashboard = L(() => import('./pages/admin/Dashboard'));
const AdminUsers = L(() => import('./pages/admin/Users'));
const AdminMentors = L(() => import('./pages/admin/MentorApprovals'));
const AdminMentorships = L(() => import('./pages/admin/Mentorships'));
const AdminTaxonomy = L(() => import('./pages/admin/Taxonomy'));
const AdminFinance = L(() => import('./pages/admin/Finance'));
const AdminSettings = L(() => import('./pages/admin/Settings'));
const AdminAudit = L(() => import('./pages/admin/Audit'));

const page = (C: ComponentType) => <Suspense fallback={<Spinner />}><C /></Suspense>;

/** Signed-in area: one app shell for every role. `roles` limits a branch to the given roles (UX only — RLS is the real guard). */
function Protected({ roles, children }: { roles?: Role[]; children?: ReactNode }) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const active = useAuth((s) => s.active);
  const loc = useLocation();
  if (!user && !ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  const role = active ?? user.roles[0];
  if (roles && !roles.includes(role)) {
    const other = user.roles.find((r) => roles.includes(r));
    if (other) { useAuth.getState().setActive(other); return <Spinner />; }
    return <Navigate to={ROLE_HOME[role]} replace />;
  }
  return <>{children ?? <Outlet />}</>;
}

function AppHome() {
  const user = useAuth((s) => s.user);
  const active = useAuth((s) => s.active);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[active ?? user.roles[0]]} replace />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={page(Home)} />
        <Route path="/mentors" element={page(Mentors)} />
        <Route path="/mentors/:slug" element={page(MentorProfile)} />
        <Route path="/how-it-works" element={page(HowItWorks)} />
        <Route path="/pricing" element={page(Pricing)} />
        <Route path="/become-a-mentor" element={page(BecomeMentor)} />
        <Route path="/login" element={page(Login)} />
        <Route path="/register" element={page(Register)} />
        <Route path="/forgot-password" element={page(ForgotPassword)} />
        <Route path="/reset-password" element={page(ResetPassword)} />

        <Route path="/app" element={<Protected><PortalLayout><Outlet /></PortalLayout></Protected>}>
          <Route index element={<AppHome />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Account />} />

          <Route path="mentee" element={<Protected roles={['mentee']} />}>
            <Route index element={<MenteeDashboard />} />
            <Route path="assessment" element={<Assessment />} />
            <Route path="plan" element={<MenteePlan />} />
            <Route path="tasks" element={<MenteeTasks />} />
            <Route path="sessions" element={<Sessions role="mentee" />} />
            <Route path="mentors" element={<MyMentors />} />
            <Route path="payments" element={<Payments />} />
          </Route>

          <Route path="mentor" element={<Protected roles={['mentor']} />}>
            <Route index element={<MentorDashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="mentees" element={<MyMentees />} />
            <Route path="mentees/:id" element={<MentorshipDetail as="mentor" />} />
            <Route path="reviews" element={<ReviewQueue />} />
            <Route path="sessions" element={<Sessions role="mentor" />} />
            <Route path="profile" element={<MentorProfileEditor />} />
            <Route path="earnings" element={<Earnings />} />
          </Route>

          <Route path="supervisor" element={<Protected roles={['supervisor', 'program_manager', 'admin']} />}>
            <Route index element={<SupervisorDashboard />} />
            <Route path="mentees" element={<SupervisorMentees />} />
            <Route path="mentees/:id" element={<MentorshipDetail as="supervisor" />} />
          </Route>

          <Route path="admin" element={<Protected roles={['admin', 'support']} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="mentors" element={<AdminMentors />} />
            <Route path="mentorships" element={<AdminMentorships />} />
            <Route path="mentorships/:id" element={<MentorshipDetail as="admin" />} />
            <Route path="taxonomy" element={<AdminTaxonomy />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
