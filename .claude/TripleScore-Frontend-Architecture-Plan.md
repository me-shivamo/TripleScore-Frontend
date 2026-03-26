# TripleScore Frontend Architecture Plan — Phases 4–8

## Phase Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 4A | Foundation: Types + Services | ⬜ Not Started |
| 4B | Shared Question Engine | ⬜ Not Started |
| 4C | Practice Page | ⬜ Not Started |
| 5 | Mocks Page | ⬜ Not Started |
| 6 | Analytics Page | ⬜ Not Started |
| 7 | Leaderboard Page | ⬜ Not Started |
| 8 | Profile Page | ⬜ Not Started |

**Legend:** ⬜ Not Started → 🔄 In Progress → ✅ Done

---

## Context

TripleScore is a JEE AI study companion. Phases 1–3 are done (auth, dashboard, Nova chat, diagnostic). This plan covers the 5 remaining pages: **Practice, Mocks, Analytics, Leaderboard, Profile**. The goal is to design the complete frontend architecture so these pages can be built correctly, consistently, and in the right order.

**User decisions captured:**
- Practice: Daily Set + Manual topic selection (both options)
- Post-answer: Practice mode = immediate feedback; Mock mode = save for end review
- Mocks: Full 3-hour JEE mock + AI analysis at the end
- Analytics: All insights (subject accuracy, weekly trend, chapter heatmap, time analysis)
- Leaderboard: Global ranking, weekly reset
- Profile: Full profile page with badges, stats, XP

---

## What These Words Mean (Beginner's Guide)

Before the architecture, here's what the 4 building blocks mean — using real examples from the existing code:

### Types — "The contract"
A type describes the shape of data. Like a form template that says "this data must have these exact fields."

Example already in the code: `DashboardResponse` in `src/types/api.ts` says the dashboard will always have `readiness_score`, `gamification`, `missions`, etc. TypeScript checks this automatically — if you try to use a field that doesn't exist, it warns you before you even run the code.

**Real-world analogy**: A job application form. It specifies what fields are required (name, email, phone). A "type" does the same for data.

### Services — "The phone call to the server"
A service is a function that talks to the backend. It knows the URL, the method (GET/POST), and how to send/receive data.

Example already in the code: `getQuestions()` in `src/services/diagnostic.ts` sends a POST to `/diagnostic/questions` and returns question data. The page never needs to know URLs or authentication — services handle that.

**Real-world analogy**: A waiter in a restaurant. The customer (component) tells the waiter what they want. The waiter goes to the kitchen (server) and brings back the food. The customer doesn't go to the kitchen directly.

### Hooks — "The reusable brain"
A hook is a function that a component calls to get data and actions. It hides complexity: when to fetch, how to cache, what to show while loading.

Example already in the code: `useNovaChat` — the `ChatWindow` component calls it and gets back `messages`, `isLoading`, and `sendMessage`. The component knows nothing about streaming or abort controllers. The hook handles all of that.

**Real-world analogy**: A remote control. You press "volume up" — you don't know how the TV's internal circuitry works. The hook is the remote.

### Components — "The visible piece"
A component is a function that returns what the user sees. It receives props (its settings), optionally calls hooks, and returns what gets rendered on screen.

Example already in the code: `MissionCard` takes a `mission` prop and renders a card with a progress bar. It doesn't fetch data — it just renders what it receives. That makes it reusable anywhere.

**Real-world analogy**: A LEGO brick. Each brick has a specific shape and purpose. You combine them to build a page. Some bricks are simple (a button), some are complex (a chat window), but they all snap together.

---

## Full Folder Structure (New Files Only)

```
src/
├── app/
│   ├── practice.tsx          — replace existing stub
│   ├── mocks.tsx             — replace existing stub
│   ├── analytics.tsx         — replace existing stub
│   ├── leaderboard.tsx       — replace existing stub
│   └── profile.tsx           — NEW (add to Sidebar navItems too)
│
├── components/
│   ├── questions/             — SHARED by Practice AND Mock
│   │   ├── QuestionSession.tsx     — The core shared component
│   │   ├── QuestionCard.tsx        — Renders one question (MCQ/INTEGER)
│   │   ├── SessionProgress.tsx     — Top bar: progress, timer, question count
│   │   ├── AnswerFeedback.tsx      — Practice-mode: correct/wrong + explanation
│   │   └── SessionSummary.tsx      — End-of-session stats screen
│   │
│   ├── practice/
│   │   ├── PracticeHome.tsx        — Two entry options: Daily Set / Choose Topic
│   │   └── TopicSelector.tsx       — Subject + chapter dropdowns
│   │
│   ├── mocks/
│   │   ├── MocksHome.tsx           — Past mock list + Start button
│   │   ├── MockConfig.tsx          — Full JEE / Subject mock selector
│   │   ├── MockHistoryCard.tsx     — One past mock result row
│   │   ├── MockTimer.tsx           — Countdown clock
│   │   └── MockAnalysis.tsx        — AI analysis + charts
│   │
│   ├── analytics/
│   │   ├── SubjectAccuracyChart.tsx    — Recharts BarChart
│   │   ├── WeeklyTrendChart.tsx        — Recharts LineChart
│   │   ├── ChapterHeatmap.tsx          — CSS grid, color by mastery
│   │   ├── TimeAnalysisChart.tsx       — Study hours BarChart
│   │   ├── InsightCard.tsx             — AI insight text card
│   │   └── AnalyticsPeriodToggle.tsx   — 7d / 30d / All Time
│   │
│   ├── leaderboard/
│   │   ├── LeaderboardTable.tsx    — Ranked list
│   │   ├── LeaderboardCard.tsx     — One student row
│   │   ├── UserRankBanner.tsx      — Sticky "You are #342" banner
│   │   └── WeeklyCountdown.tsx     — Time until weekly reset
│   │
│   └── profile/
│       ├── ProfileHeader.tsx       — Avatar, name, level badge
│       ├── ExamCountdown.tsx       — Days until JEE
│       ├── SubjectSettings.tsx     — Edit strong/weak subjects
│       ├── BadgeGallery.tsx        — Earned + locked badges
│       ├── StatsOverview.tsx       — Lifetime stats grid
│       └── XPTimeline.tsx          — XP progression chart
│
├── hooks/
│   ├── usePractice.ts         — NEW
│   ├── useMock.ts             — NEW
│   ├── useAnalytics.ts        — NEW
│   ├── useLeaderboard.ts      — NEW
│   └── useProfile.ts          — NEW
│
├── services/
│   ├── practice.ts            — NEW
│   ├── mock.ts                — NEW
│   ├── analytics.ts           — NEW
│   ├── leaderboard.ts         — NEW
│   └── profile.ts             — NEW
│
└── types/
    └── api.ts                 — add 5 new sections
```

---

## The Critical Shared Component: QuestionSession

This is the most important piece of the architecture. Both Practice and Mock use the same question-solving UI — the only difference is what happens after the student answers.

### Props Interface

```typescript
// src/components/questions/QuestionSession.tsx

export type SessionMode = "PRACTICE" | "MOCK";

export interface SessionQuestion {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  content: string;
  questionType: "MCQ" | "INTEGER";
  options: QuestionOption[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  explanation: string;       // shown only in PRACTICE mode
  correctOption: string;     // revealed only in PRACTICE mode
}

export interface SessionAttempt {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean | null; // null in MOCK mode
  timeTakenSecs: number;
}

export interface SessionResult {
  attempts: SessionAttempt[];
  totalTimeSecs: number;
  correctCount: number | null; // null in MOCK mode
}

export interface QuestionSessionProps {
  questions: SessionQuestion[];
  mode: SessionMode;           // "PRACTICE" or "MOCK"
  subject: string;
  chapter?: string;            // optional — mock has no single chapter
  timeLimitSecs?: number;      // only for MOCK (3hr = 10800, 1hr = 3600)
  onComplete: (result: SessionResult) => void;
  onAskNova?: (question: SessionQuestion) => void; // only in PRACTICE
  onEarlySubmit?: () => void;  // "Submit Mock" button
}
```

**How the mode difference works:**
- `PRACTICE`: After student confirms answer → show `AnswerFeedback` (correct/wrong + explanation + "Ask Nova" button) → student clicks "Next" to advance
- `MOCK`: After student confirms answer → immediately advance to next question, no feedback shown

**What to reuse:** `QuizScreen.tsx` already has MCQ/INTEGER rendering, per-question timer, and `"idle" | "selected" | "confirmed"` state. Extract these into `QuestionCard` and `SessionProgress` — do not copy-paste, refactor.

---

## Practice Page State Machine

Page file: `src/app/practice.tsx`
Pattern: same `type Screen = "..." ` + `useState<Screen>` as `diagnostic.tsx`

```
type PracticeScreen = "home" | "topic-select" | "session" | "summary"

TRANSITIONS:
home
  → "Daily Set" clicked    → fetch GET /practice/daily → screen = "session"
  → "Choose Topic" clicked → screen = "topic-select"

topic-select
  → subject + chapter confirmed → fetch POST /practice/start → screen = "session"
  → back                        → screen = "home"

session (PRACTICE mode — QuestionSession)
  → student answers      → AnswerFeedback shown (correct/wrong + explanation)
  → student clicks Next  → advance to next question
  → "Ask Nova" clicked   → router.push("/chat") with question context
  → all questions done   → POST /practice/submit → screen = "summary"

summary (SessionSummary)
  → "Practice Again" → screen = "home"
  → "Go to Dashboard" → router.push("/dashboard")
```

---

## Mock Page State Machine

Page file: `src/app/mocks.tsx`

```
type MockScreen = "home" | "config" | "session" | "submitting" | "analysis"

TRANSITIONS:
home
  → "Start New Mock" → screen = "config"

config
  → "Full JEE Mock" confirmed   → POST /mocks/start {type:"FULL"}
                                    → gets {mock_id, questions[], time_limit_secs}
                                    → screen = "session"
  → "Subject Mock" confirmed    → POST /mocks/start {type:"SUBJECT", subject}
                                    → screen = "session"
  → back                        → screen = "home"

session (MOCK mode — QuestionSession, timer running)
  → timer reaches 0 OR student clicks "Submit" → POST /mocks/{id}/submit
                                                  → screen = "submitting"
                                                  → start polling every 3s

submitting (polling: GET /mocks/{id}/analysis-status)
  → status = "COMPLETED" → GET /mocks/{id}/analysis → screen = "analysis"
  → status = "FAILED"    → screen = "analysis" (partial data, show error)
  → timeout after 60s    → screen = "analysis" (partial data)

analysis (MockAnalysis)
  → "Practice weak areas" → router.push("/practice")
  → "Back to Mocks"       → screen = "home" (re-fetch history)
```

**Critical implementation note:** Polling interval stored in `useRef` (not `useState`). Clear it in `useEffect` cleanup to prevent memory leaks. Same pattern as `abortControllerRef` in `useNovaChat.ts`.

---

## New API Endpoints Needed (Backend must build these)

| Method | URL | Purpose |
|--------|-----|---------|
| GET | /practice/daily | Fetch today's curated question set |
| POST | /practice/start | Start a topic session (subject + chapter) |
| POST | /practice/submit | Submit session results |
| GET | /practice/chapters?subject= | Get chapters list per subject |
| POST | /mocks/start | Start a new mock test |
| POST | /mocks/{id}/submit | Submit mock answers |
| GET | /mocks/{id}/analysis-status | Poll analysis status |
| GET | /mocks/{id}/analysis | Get completed analysis |
| GET | /mocks/history | List past mocks |
| GET | /analytics?period= | Get all analytics (7d/30d/all) |
| GET | /leaderboard/weekly | Global weekly leaderboard |
| GET | /profile | Get user profile + badges + stats |
| PATCH | /profile | Update profile settings |

---

## New TypeScript Types (add to `src/types/api.ts`)

### Practice
```typescript
PracticeQuestion { id, subject, chapter, topic, content, question_type,
                   options, correct_option, explanation, difficulty }
DailySetResponse { session_id, questions[], total_xp_possible }
PracticeStartResponse { session_id, questions[], subject, chapter }
PracticeAttempt { question_id, selected_option, time_taken_secs }
PracticeSubmitResponse { session_id, correct, total, accuracy, xp_earned, time_taken_secs }
```

### Mocks
```typescript
MockType = "FULL" | "SUBJECT"
MockStartRequest { type, subject? }
MockStartResponse { mock_id, test_name, questions[], time_limit_secs }
MockAttempt { question_id, selected_option, time_taken_secs }
MockSubmitResponse { mock_id, analysis_status }
MockAnalysisStatusResponse { mock_id, analysis_status }
SubjectScore { subject, attempted, correct, score, max_score, accuracy, avg_time_secs }
MockAnalysisData { mock_id, test_name, attempt_date, total_marks, max_marks, accuracy,
                   time_taken_mins, subject_scores[], wrong_questions[], ai_verdict,
                   ai_insights[], percentile_estimate }
MockHistoryItem { mock_id, test_name, attempt_date, total_marks, max_marks, accuracy,
                  physics_score, chemistry_score, math_score, time_taken_mins, analysis_status }
MockHistoryResponse { mocks[] }
```

### Analytics
```typescript
AnalyticsPeriod = "7d" | "30d" | "all"
SubjectAccuracy { subject, attempted, correct, accuracy }
DailyDataPoint { date, questions_attempted, questions_correct, xp_earned, study_minutes }
ChapterMastery { subject, chapter, mastery_score (0-1), total_attempted, is_unlocked }
AnalyticsInsight { id, type: "weakness"|"strength"|"trend"|"suggestion", text, subject? }
AnalyticsResponse { period, subject_accuracy[], daily_trend[], chapter_mastery[],
                    total_questions, total_study_hours, avg_accuracy,
                    avg_time_per_question_secs, insights[] }
```

### Leaderboard
```typescript
LeaderboardEntry { rank, user_id, name, avatar_url, xp_this_week, level, is_current_user }
LeaderboardResponse { entries[], current_user_rank, current_user_entry, week_reset_at }
```

### Profile
```typescript
BadgeData { id, name, description, icon_url, rarity, xp_reward, earned, earned_at }
LifetimeStats { total_questions_solved, total_study_hours, best_streak, mocks_completed, avg_accuracy }
XPEvent { amount, reason, created_at }
ProfileResponse { user{}, profile{}, gamification, lifetime_stats, badges[], xp_history[] }
ProfileUpdateRequest { exam_attempt_date?, strong_subjects?, weak_subjects?,
                       daily_study_hours?, target_score? }
```

---

## New Services (each follows `src/services/diagnostic.ts` pattern)

```
practice.ts:   getDailySet(), startPracticeSession(subject, chapter, count),
               submitPracticeSession(sessionId, attempts), getChaptersBySubject(subject)

mock.ts:       startMock(request), submitMock(mockId, attempts),
               getMockAnalysisStatus(mockId), getMockAnalysis(mockId), getMockHistory()

analytics.ts:  getAnalytics(period)

leaderboard.ts: getLeaderboard()

profile.ts:    getProfile(), updateProfile(data)
```

---

## New Hooks

```
usePractice.ts    — wraps fetchChapters, loadDailySet, startTopicSession, submitSession
useMock.ts        — wraps startMock, submitMock, polling loop, timer state, mock history
useAnalytics.ts   — useQuery({ queryKey: ["analytics", period], staleTime: 5min })
useLeaderboard.ts — useQuery({ queryKey: ["leaderboard"], refetchInterval: 2min })
useProfile.ts     — useQuery + useMutation (invalidates "profile" + "dashboard" on update)
```

---

## What to Reuse from Existing Code

| Existing | Reuse In | How |
|----------|----------|-----|
| `QuizScreen.tsx` | `QuestionCard`, `SessionProgress` | Extract MCQ/INTEGER rendering + timer + AnswerState machine |
| `TestResults.tsx` | `SessionSummary` | Score ring SVG, stat breakdown pattern |
| `ChapterSelector.tsx` | `TopicSelector` | Dropdown pattern + click-outside logic |
| `FinalSummary.tsx` | `MockAnalysis` | SubjectRow pattern for subject breakdown |
| `diagnostic.tsx` state machine | `practice.tsx`, `mocks.tsx` | `type Screen` + `useState<Screen>` pattern |
| `services/diagnostic.ts` | All 5 new services | `apiFetch` + `!res.ok` throw + typed return |
| `getLevelFromXP`, `getXPProgressToNextLevel` | `ProfileHeader`, `XPTimeline` | Already in `lib/utils.ts` |
| `shadcn Badge` variants (gold, purple, green) | `BadgeGallery` | LEGENDARY=gold, EPIC=purple, RARE=green |

---

## Recharts Chart Pattern

All charts: `ResponsiveContainer width="100%" height={250}` + consistent colours:
- Physics: `#3b82f6` (blue-500)
- Chemistry: `#10b981` (emerald-500)
- Math: `#8b5cf6` (violet-500)

`ChapterHeatmap` is NOT a Recharts chart — it's a CSS grid where each cell's `background-color` maps to mastery: red-100 (0–25%) → amber-100 (26–50%) → blue-100 (51–75%) → emerald-100 (76–100%).

---

## Order of Implementation

**Phase 4A — Foundation (everything depends on this)**
1. Add all type sections to `src/types/api.ts`
2. Create all 5 service files

**Phase 4B — Shared Question Engine**
3. `components/questions/QuestionCard.tsx`
4. `components/questions/SessionProgress.tsx`
5. `components/questions/AnswerFeedback.tsx`
6. `components/questions/SessionSummary.tsx`
7. `components/questions/QuestionSession.tsx`

**Phase 4C — Practice Page**
8. `hooks/usePractice.ts`
9. `components/practice/TopicSelector.tsx`
10. `components/practice/PracticeHome.tsx`
11. `app/practice.tsx` (replace stub)

**Phase 5 — Mocks Page**
12. `hooks/useMock.ts`
13. `components/mocks/` (all 5 components)
14. `app/mocks.tsx` (replace stub)

**Phase 6 — Analytics Page**
15. `hooks/useAnalytics.ts`
16. `components/analytics/` (all 6 components)
17. `app/analytics.tsx` (replace stub)

**Phase 7 — Leaderboard Page**
18. `hooks/useLeaderboard.ts`
19. `components/leaderboard/` (all 4 components)
20. `app/leaderboard.tsx` (replace stub)

**Phase 8 — Profile Page**
21. `hooks/useProfile.ts`
22. `components/profile/` (all 6 components)
23. `app/profile.tsx` (new page)
24. Add `/profile` to `Sidebar.tsx` navItems

---

## Critical Files to Read Before Building

- `src/components/diagnostic/QuizScreen.tsx` — extract `QuestionCard` + `SessionProgress` from here
- `src/app/diagnostic.tsx` — the definitive multi-screen state machine pattern
- `src/services/diagnostic.ts` — the template every new service must follow
- `src/types/api.ts` — where all new types are added (follow existing comment-header sections)
- `src/components/layout/Sidebar.tsx` — add `/profile` route here in Phase 8

---

## Verification Plan

For each phase, test end-to-end:

1. **Practice**: Start app → go to `/practice` → click "Daily Set" → solve 3 questions → check feedback appears after each → finish → verify XP updates in TopBar
2. **Practice (topic)**: `/practice` → "Choose Topic" → select Physics > Kinematics → start session → verify questions are from correct chapter
3. **Mocks**: `/mocks` → "Start New Mock" → select "Full JEE Mock" → answer 5 questions → click "Submit" → see "Analysing..." screen → wait for analysis → verify charts render
4. **Analytics**: `/analytics` → verify 4 charts load → toggle "7d" → "30d" → verify data changes → check chapter heatmap shows colors
5. **Leaderboard**: `/leaderboard` → verify top 100 loads → verify current user row is highlighted → verify countdown shows correct time
6. **Profile**: `/profile` → verify all sections load → edit exam date → click save → verify dashboard "days until exam" updates
