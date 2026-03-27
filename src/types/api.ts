// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface GamificationData {
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
}

export interface TodayStats {
  questions_attempted: number;
  questions_correct: number;
  study_minutes: number;
  xp_earned: number;
}

export interface MissionData {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  progress: number;
  target: number;
  completed: boolean;
  type: string;
}

export interface ProfileData {
  onboarding_completed: boolean;
  strong_subjects: string[];
  weak_subjects: string[];
}

export interface DashboardResponse {
  readiness_score: number | null;
  days_until_exam: number | null;
  gamification: GamificationData;
  today_stats: TodayStats;
  missions: MissionData[];
  profile: ProfileData;
}

// ─── Nova ────────────────────────────────────────────────────────────────────

export interface OnboardingStatusResponse {
  onboarding_completed: boolean;
  onboarding_step: number;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface HistoryResponse {
  messages: ChatMessage[];
}

// ─── Diagnostic ──────────────────────────────────────────────────────────────

export interface ChapterSuggestion {
  subject: string;
  chapter: string;
}

export interface ProfileInfo {
  name: string | null;
  exam_attempt_date: string | null;
  strong_subjects: string[];
  weak_subjects: string[];
  previous_score: number | null;
  daily_study_hours: number | null;
}

export interface DiagnosticStartResponse {
  already_done: boolean;
  profile: ProfileInfo | null;
  strong_suggestion: ChapterSuggestion | null;
  weak_suggestion: ChapterSuggestion | null;
  chapters_by_subject: Record<string, string[]> | null;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface DiagnosticQuestion {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  content: string;
  question_type: string;
  options: QuestionOption[];
  difficulty: string;
}

export interface QuestionsResponse {
  questions: DiagnosticQuestion[];
}

export interface SubmitAttempt {
  question_id: string;
  selected_option: string | null;
  time_taken_secs: number;
}

export interface SubmitResult {
  score: { correct: number; total: number };
  mastery_score: number;
  session_id: string;
  xp_result: Record<string, unknown>;
}

// ─── Practice ────────────────────────────────────────────────────────────────

export interface PracticeQuestion {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  content: string;
  question_type: "MCQ" | "INTEGER";
  options: QuestionOption[];
  correct_option: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  image_url: string | null;
}

export interface PracticeQuestionsResponse {
  questions: PracticeQuestion[];
}

export interface ChaptersResponse {
  chapters: string[];
}

export interface PracticeAttempt {
  question_id: string;
  selected_option: string | null;
  time_taken_secs: number;
}

export interface PracticeSubmitResponse {
  session_id: string;
  correct: number;
  total: number;
  accuracy: number;
  xp_earned: number;
}
