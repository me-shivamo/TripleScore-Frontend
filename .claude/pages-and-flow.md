# TripleScore Frontend — Pages, User Flow & Backend Connections

## Pages (9 total)

| Route | File | Description | Status |
|-------|------|-------------|--------|
| `/` | `src/app/page.tsx` | Root redirect hub | Active |
| `/login` | `src/app/(auth)/login/page.tsx` | Google sign-in landing page | Active |
| `/chat` | `src/app/(app)/chat/page.tsx` | Nova AI chat (onboarding + companion) | Active |
| `/diagnostic` | `src/app/(app)/diagnostic/page.tsx` | Dual diagnostic test flow | Active |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | Main hub with score/stats/missions | Active |
| `/practice` | `src/app/(app)/practice/page.tsx` | Question practice | Coming Soon |
| `/mocks` | `src/app/(app)/mocks/page.tsx` | Mock tests | Coming Soon |
| `/analytics` | `src/app/(app)/analytics/page.tsx` | Performance charts | Coming Soon |
| `/leaderboard` | `src/app/(app)/leaderboard/page.tsx` | Seasonal rankings | Coming Soon |

---

## User Flow

```
Visit any URL (/)
    │
    ├─ Not authenticated → /login → Google OAuth (Firebase)
    │
    └─ Authenticated
           │
           ├─ Onboarding NOT done → /chat (Nova asks profile/subject questions)
           │       │
           │       └─ Onboarding complete (detected via 5s poll) → /diagnostic (after 3s delay)
           │               │
           │               ├─ Skip → /dashboard
           │               └─ Complete both tests (strong + weak subject) → /dashboard
           │
           └─ Onboarding done → /dashboard
                   │
                   └─ Navigate via sidebar (desktop) / bottom nav (mobile):
                      /chat, /practice, /mocks, /analytics, /leaderboard
```

**Important:** Sidebar and mobile nav are hidden on `/chat` and `/diagnostic` to keep the onboarding flow focused.

---

## Route Layout Groups

- `(auth)` group — unauthenticated routes: `/login`
- `(app)` group — authenticated routes: all others. Protected by `useAuth()` in `src/app/(app)/layout.tsx`

---

## Frontend ↔ Backend Connections

**Backend base URL:** `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:8000`)
**Auth:** Firebase client SDK issues ID token → attached as `Authorization: Bearer <token>` by `src/lib/api-client.ts` → backend `api/deps.py` verifies via Firebase Admin SDK.

| Frontend Page / Service | Backend Endpoint | Notes |
|------------------------|-----------------|-------|
| `src/services/auth.ts` — `login()` | `POST /auth/login` | Upserts user in DB, returns `onboarding_completed` |
| `src/app/page.tsx` + App layout | `GET /nova/onboarding-status` | Routes to `/chat` or `/dashboard` |
| `src/app/(app)/chat/page.tsx` | `GET /nova/history` | Loads last 50 messages |
| `src/hooks/useNovaChat.ts` | `POST /nova/chat` (streaming) | Streams text chunks via ReadableStream |
| `/chat` onboarding mode | `GET /nova/onboarding-status` | Polled every 5s; redirects to `/diagnostic` on complete |
| `src/services/diagnostic.ts` | `POST /diagnostic/start` | Returns profile + suggested chapters |
| | `POST /diagnostic/questions` | Fetches 12 random questions per chapter |
| | `POST /diagnostic/submit` | Grades test, awards XP, seeds mastery estimates |
| | `POST /diagnostic/skip` | Marks diagnostic skipped, seeds priors for all chapters |
| `src/services/dashboard.ts` — `getDashboard()` | `GET /dashboard` | Re-fetched every 60s; returns readiness score, XP, missions |

---

## Key Files

**Auth & routing:**
- `src/app/page.tsx` — root redirect logic
- `src/app/(app)/layout.tsx` — auth guard, onboarding mode detection
- `src/hooks/useAuth.ts` — Firebase auth state hook

**Navigation components:**
- `src/components/layout/Sidebar.tsx` — desktop nav
- `src/components/layout/MobileNav.tsx` — mobile bottom nav
- `src/components/layout/TopBar.tsx` — XP, level, streak bar

**API layer:**
- `src/lib/api-client.ts` — `apiFetch()` and `apiStream()` with auto Bearer token
- `src/services/auth.ts`, `dashboard.ts`, `nova.ts`, `diagnostic.ts`
- `src/hooks/useNovaChat.ts` — streaming chat hook

---

## Full Login → Dashboard Data Flow

1. User clicks "Get started" → Google sign-in via Firebase
2. Firebase Client SDK gets ID token
3. `POST /auth/login` — backend upserts user + Gamification record
4. `GET /nova/onboarding-status` — determines route
5. If not onboarded → `/chat`; if onboarded → `/dashboard`
6. Dashboard calls `GET /dashboard` → renders readiness score, XP, missions
