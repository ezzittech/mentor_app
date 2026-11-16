/** Row types — mirror the tables in supabase/migrations. */
export type Role = 'mentee' | 'mentor' | 'supervisor' | 'program_manager' | 'admin' | 'support';

export type Profile = {
  id: string; full_name: string; email: string; avatar_url: string | null; headline: string | null;
  country: string | null; timezone: string; locale: 'ar' | 'en'; bio: string | null; phone: string | null;
  is_active: boolean; created_at: string;
};

export type Category = { id: number; slug: string; name_en: string; name_ar: string; icon: string | null; color: string | null };
export type Skill = { id: number; name: string; category_id: number | null };

export type Package = {
  id: number; mentor_id: string; name: string; description: string | null; price: number; currency: string;
  billing: 'monthly' | 'one_off'; calls_per_month: number; call_minutes: number; chat_support: boolean;
  response_hours: number; features: string[]; is_active: boolean; sort: number; trial_days: number;
};

export type MentorStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
export type Mentor = {
  id: string; slug: string; full_name: string; avatar_url: string | null; headline: string; bio: string;
  job_title: string | null; company: string | null; years_experience: number; country: string | null; timezone: string;
  languages: string[]; status: MentorStatus; is_published: boolean; featured: boolean; accepting: boolean;
  rating_avg: number; reviews_count: number; mentees_count: number; response_hours: number;
  linkedin_url: string | null; video_url: string | null; created_at: string;
  categories: Category[]; skills: string[]; packages: Package[]; spots_left: number;
};

export type RequestStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
export type MentorshipRequest = {
  id: number; mentee_id: string; mentor_id: string; package_id: number | null; goal: string; background: string | null;
  expectations: string | null; status: RequestStatus; decision_note: string | null; created_at: string; decided_at: string | null;
  mentee?: { full_name: string; headline: string | null; country: string | null } | null;
  mentor?: { full_name: string; slug: string; headline: string } | null;
  package?: { name: string; price: number; currency: string } | null;
};

export type MentorshipStatus = 'pending_setup' | 'active' | 'paused' | 'completed' | 'cancelled';
export type Mentorship = {
  id: number; mentee_id: string; mentor_id: string; supervisor_id: string | null; package_id: number | null;
  status: MentorshipStatus; started_at: string; ended_at: string | null; last_activity_at: string | null;
  mentee?: { full_name: string; headline: string | null; avatar_url: string | null } | null;
  mentor?: { full_name: string; headline: string | null; avatar_url: string | null } | null;
  supervisor?: { full_name: string } | null;
  package?: { name: string } | null;
};

export type QuestionKind = 'short' | 'long' | 'single' | 'multi' | 'scale' | 'date';
export type Question = { id: number; template_id: number; kind: QuestionKind; prompt_en: string; prompt_ar: string; options: { en: string; ar: string }[] | null; required: boolean; sort: number; section: string };
export type AssessmentStatus = 'draft' | 'submitted' | 'needs_info' | 'reviewed';
export type Assessment = { id: number; mentee_id: string; template_id: number; status: AssessmentStatus; answers: Record<string, unknown>; submitted_at: string | null; review_note: string | null; kind: 'initial' | 'final' };

export type PlanStatus = 'draft' | 'pending_approval' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type Plan = {
  id: number; mentorship_id: number; mentee_id: string; mentor_id: string; title: string; summary: string | null;
  status: PlanStatus; start_date: string | null; target_date: string | null; approved_at: string | null; version: number; created_at: string;
};
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'partially_achieved' | 'not_achieved' | 'dropped';
export type Goal = {
  id: number; plan_id: number; title: string; description: string | null; rationale: string | null; baseline: string | null;
  target: string | null; success_criteria: string | null; priority: 'low' | 'medium' | 'high'; status: GoalStatus;
  due_date: string | null; sort: number;
};
export type Milestone = { id: number; plan_id: number; goal_id: number | null; title: string; due_date: string | null; done: boolean };
export type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'changes_requested' | 'completed' | 'cancelled';
export type TaskKind = 'exercise' | 'project' | 'review' | 'session' | 'resource';
export type Task = {
  id: number; plan_id: number; goal_id: number | null; title: string; description: string | null; kind: TaskKind;
  status: TaskStatus; due_date: string | null; resource_url: string | null; created_at: string; updated_at: string;
};
export type Submission = { id: number; task_id: number; author_id: string; body: string; link_url: string | null; created_at: string; author?: { full_name: string } | null };
export type Feedback = { id: number; task_id: number; author_id: string; body: string; decision: 'approved' | 'changes_requested' | 'comment'; created_at: string; author?: { full_name: string } | null };
export type Resource = { id: number; plan_id: number; goal_id: number | null; title: string; url: string; kind: 'article' | 'video' | 'course' | 'book' | 'tool'; provider: string | null; done: boolean };

export type SessionStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'failed';
export type Session = {
  id: number; mentorship_id: number; mentee_id: string; mentor_id: string; goal_id: number | null; title: string;
  starts_at: string; duration_min: number; timezone: string; status: SessionStatus; meeting_url: string | null;
  agenda: string | null; shared_notes: string | null; created_at: string;
  mentee?: { full_name: string } | null; mentor?: { full_name: string } | null;
};

export type Message = { id: number; mentorship_id: number; sender_id: string; body: string; created_at: string; read_at: string | null };

export type NoteVisibility = 'private' | 'staff' | 'mentee';
export type SupervisionNote = { id: number; mentorship_id: number; author_id: string; body: string; visibility: NoteVisibility; created_at: string; author?: { full_name: string } | null };
export type Intervention = { id: number; mentorship_id: number; author_id: string; kind: 'reminder' | 'reschedule' | 'plan_revision' | 'escalation' | 'check_in'; note: string; status: 'open' | 'resolved'; created_at: string };

export type Review = { id: number; mentorship_id: number; mentee_id: string; mentor_id: string; rating: number; comment: string; is_public: boolean; created_at: string; mentee?: { full_name: string; headline: string | null } | null };

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type Order = {
  id: number; mentee_id: string; mentor_id: string; package_id: number | null; mentorship_id: number | null; amount: number; currency: string;
  commission_rate: number; commission_amount: number; status: PaymentStatus; provider: string | null; created_at: string;
  mentee?: { full_name: string } | null; mentor?: { full_name: string } | null; package?: { name: string } | null;
};

export type Notification = { id: number; user_id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };
export type AuditLog = { id: number; actor_id: string | null; action: string; entity: string; entity_id: string | null; data: Record<string, unknown> | null; created_at: string; actor?: { full_name: string } | null };
export type UserRow = Profile & { roles: Role[] };
