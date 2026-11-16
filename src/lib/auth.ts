import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hasSupabase, supabase } from './supabase';
import type { Profile, Role } from './types';

export type SessionUser = { id: string; name: string; email: string; roles: Role[]; demo?: boolean };

/** Demo accounts preview each workspace with sample data held in memory (never touches the database). */
export const DEMO_USERS: Record<'mentee' | 'mentor' | 'supervisor' | 'admin', SessionUser> = {
  mentee: { id: 'demo-mentee', name: 'Sara Al-Harbi', email: 'mentee@demo.murshid', roles: ['mentee'], demo: true },
  mentor: { id: 'm-1', name: 'Omar Khalid', email: 'mentor@demo.murshid', roles: ['mentor'], demo: true },
  supervisor: { id: 'demo-supervisor', name: 'Huda Nasser', email: 'supervisor@demo.murshid', roles: ['supervisor'], demo: true },
  admin: { id: 'demo-admin', name: 'Platform Admin', email: 'admin@demo.murshid', roles: ['admin', 'mentor', 'supervisor'], demo: true },
};

type AuthState = {
  user: SessionUser | null;
  profile: Profile | null;
  active: Role | null;
  ready: boolean;
  signInDemo: (u: SessionUser) => void;
  setActive: (r: Role) => void;
  signOut: () => Promise<void>;
  load: () => Promise<void>;
};

const ORDER: Role[] = ['admin', 'program_manager', 'supervisor', 'mentor', 'support', 'mentee'];

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      active: null,
      ready: false,
      signInDemo: (user) => set({ user, profile: null, active: user.roles[0] }),
      setActive: (r) => { if (get().user?.roles.includes(r)) set({ active: r }); },
      signOut: async () => {
        if (!get().user?.demo && hasSupabase) await supabase.auth.signOut();
        set({ user: null, profile: null, active: null });
      },
      load: async () => {
        if (!hasSupabase) { set((s) => ({ ready: true, user: s.user?.demo ? s.user : null })); return; }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { set((s) => ({ user: s.user?.demo ? s.user : null, profile: null, ready: true })); return; }
        const [{ data: p }, { data: r }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', session.user.id),
        ]);
        const roles = ((r ?? []).map((x) => x.role) as Role[]).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
        if (!roles.length) roles.push('mentee');
        const prev = get().active;
        set({
          profile: p as Profile | null,
          user: { id: session.user.id, email: session.user.email ?? '', name: (p as Profile | null)?.full_name || session.user.email?.split('@')[0] || 'User', roles },
          active: prev && roles.includes(prev) ? prev : roles[0],
          ready: true,
        });
      },
    }),
    { name: 'murshid-auth', partialize: (s) => ({ user: s.user?.demo ? s.user : null, active: s.active }) },
  ),
);

export const isDemo = () => !hasSupabase || !!useAuth.getState().user?.demo;
export const me = () => useAuth.getState().user;

if (hasSupabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'INITIAL_SESSION', 'TOKEN_REFRESHED'].includes(event)) {
      setTimeout(() => useAuth.getState().load(), 0);
    }
  });
} else {
  setTimeout(() => useAuth.getState().load(), 0);
}
