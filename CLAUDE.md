# UniTrack Mobile - Development Context

## Overview
UniTrack is a React Native/Expo mobile app that helps university students track attendance from their ERP portal. It provides attendance analytics, skip-day planning, and vacation planning with threshold-based risk assessment.

## Tech Stack
- **Framework:** React Native 0.81 + Expo SDK 54 + TypeScript 5.9
- **Auth & DB:** Firebase Auth (email/password) + Cloud Firestore
- **Payments:** Razorpay (platform-split: native SDK + web JS SDK)
- **Crypto:** react-native-quick-crypto (PBKDF2 + AES-GCM for ERP credential encryption)
- **Build:** EAS Build (preview APK + production AAB)

## Project Structure
```
├── App.tsx                  # Root component, global state, auth/data flow
├── index.ts                 # Entry point
├── components/              # All UI components
│   ├── DashboardScreen.tsx   # Main dashboard (pull-to-refresh, subject list)
│   ├── LoginScreen.tsx       # Auth + ERP credentials form
│   ├── AttendanceCard.tsx    # Per-subject card with progress bar
│   ├── TodayCard.tsx         # Today's classes + skip verdicts
│   ├── VacationPlanner.tsx   # Date-range vacation impact (premium)
│   ├── SkipDayPlanner.tsx    # Day-based skip scoring (premium)
│   ├── CalendarPicker.tsx    # Inline month calendar for date range
│   ├── TimetableSetup.tsx    # Manual + AI timetable entry (premium)
│   ├── UpgradeModal.tsx      # Payment flow with Razorpay
│   ├── PremiumGate.tsx       # Blurs premium content for free users
│   ├── Header.tsx            # Top bar, theme toggle, settings menu
│   ├── OverallStatsCard.tsx  # Aggregate attendance stats
│   ├── WeekOverview.tsx      # Week dots (color-coded per day)
│   ├── StatusFilter.tsx      # Filter subjects by status
│   ├── StudentInfoCard.tsx   # Student name/roll display
│   ├── ThresholdModal.tsx    # Global threshold slider
│   ├── ErrorToast.tsx        # Error notification
│   └── LoadingScreen.tsx     # Splash/loading state
├── lib/                     # Business logic, API, utilities
│   ├── api.ts                # Backend API calls (fetch attendance, parse timetable)
│   ├── config.ts             # API base URL config
│   ├── crypto.ts             # AES-GCM encrypt/decrypt for ERP passwords
│   ├── firebase.ts           # Firebase app + auth initialization
│   ├── firestore.ts          # Firestore read/write for user data
│   ├── razorpay.ts           # Barrel re-export (platform resolution)
│   ├── razorpay.native.ts    # Native Razorpay SDK integration
│   ├── razorpay.web.ts       # Web Razorpay JS SDK (dynamic script inject)
│   ├── skipPlanner.ts        # Skip-day scoring and impact calculation
│   ├── vacationPlanner.ts    # Vacation date-range impact + best window finder
│   ├── utils.ts              # Attendance math (bunkable, status, thresholds)
│   ├── types.ts              # Core types (Subject, Timetable, AttendanceData)
│   ├── useAuth.ts            # Firebase auth hook
│   ├── usePremium.ts         # Premium status computation hook
│   └── useTheme.ts           # Theme preference hook (AsyncStorage)
├── contexts/
│   └── ThemeContext.tsx       # Dark/light theme context + color palette
└── types/
    └── react-native-razorpay.d.ts  # Type declaration for Razorpay
```

## Architecture
- **State management:** App.tsx holds global state (attendance, thresholds, timetable, premium status), passes props to child components. ThemeContext for dark/light mode.
- **Data persistence:** Firestore stores all user data keyed by Firebase UID. Auto-saves on state changes with initialization guard.
- **API pattern:** Fetch with AbortController (25s timeout). Backend at configurable URL handles ERP scraping, timetable AI parsing, and Razorpay order/verification.
- **Platform splits:** Razorpay uses Metro/webpack extension resolution (`.native.ts` / `.web.ts`). Import `from '../lib/razorpay'` auto-resolves per platform.

## Premium Model
- **Free tier:** Dashboard + global threshold + 3 refreshes/month
- **Trial:** 7-day trial on signup (all features)
- **Premium (Rs 29/month):** Unlimited refreshes, per-subject thresholds, timetable, skip/vacation planner
- **PremiumGate component** wraps premium features with blur + upgrade CTA

## Key Business Logic
- **Attendance status:** `safe` (>= threshold+5%), `critical` (within 5%), `low` (below threshold)
- **Skip scoring:** Weighted penalty per subject (3x if below threshold, 2x if critical, 1x if safe), normalized 0-100
- **Vacation impact:** Aggregates missed classes across date range (excluding Sundays + holidays), computes projected attendance per subject
- **Best windows:** Scans 3/5/7-day windows over next 3 weeks, ranks by lowest weighted penalty

## Important Conventions
- No `LayoutAnimation` on Android — causes `IllegalStateException` crashes with many simultaneous layout changes
- Card styling: `borderRadius: 16, borderWidth: 1, padding: 16` + theme colors
- ERP credentials encrypted with PBKDF2 (100k iterations) + AES-GCM, stored in Firestore
- Sunday is day index 0 (JS convention), timetable uses indices 0-5 (Mon-Sat)
- All monetary values in INR (Indian Rupees)

## Build & Deploy
- `npx expo start` — dev server
- `npx expo run:android` — local Android build
- `eas build --platform android --profile preview` — EAS APK build
- Separate Next.js web app exists at `unitrack-web/` (deployed on Vercel)
- GitHub: `0xMoni/UniTrack-app`
