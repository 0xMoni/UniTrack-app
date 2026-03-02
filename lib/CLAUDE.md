# Lib - Development Context

## Overview
Business logic, API integration, Firebase services, utilities, and custom hooks. Pure logic files have no React dependencies. Hook files use React hooks.

## File Roles

### Core Types (`types.ts`)
```typescript
Subject { code, name, attended, total, percentage, status }
Timetable = Record<number, string[]>  // day index (0-5 Mon-Sat) → subject codes
AttendanceData { subjects: Subject[], studentInfo, timestamp }
```

### API (`api.ts`)
Backend communication with configurable base URL from `config.ts`.
- `fetchAttendance(erpUrl, username, password, threshold)` — scrape ERP attendance
- `parseTimetable(imageBase64, mimeType, subjectCodes)` — AI image-to-timetable
- `createPaymentOrder(uid, email)` — Razorpay order creation
- `verifyPayment(paymentData)` — payment verification + premium extension

All requests use Fetch with AbortController (25s timeout).

### Firebase (`firebase.ts`, `firestore.ts`)
- `firebase.ts` — App + Auth initialization with `browserLocalPersistence`
- `firestore.ts` — CRUD for user data: `loadUserData(uid)`, `saveUserData(uid, data)`, field-level updates

### Crypto (`crypto.ts`)
ERP credential encryption:
- PBKDF2 key derivation (100k iterations, SHA-256) using Firebase UID as password
- AES-GCM encryption with random salt (16 bytes) + IV (12 bytes)
- Stored as base64-encoded `salt:iv:ciphertext` string

### Razorpay (platform-split)
- `razorpay.ts` — barrel re-export from `./razorpay.native` (TypeScript resolution)
- `razorpay.native.ts` — uses `react-native-razorpay` native module
- `razorpay.web.ts` — dynamically injects Razorpay JS SDK, opens browser checkout
- Metro/webpack resolves `.native.ts` or `.web.ts` at build time

### Skip Planner (`skipPlanner.ts`)
Day-based skip scoring:
- `calculateDaySkipScore()` — weighted penalty per subject (3x below threshold, 2x critical, 1x safe)
- `calculateCumulativeImpact()` — multi-day selection impact
- `SubjectImpact` type: name, code, currentPct, projectedPct, classCount, breachesThreshold, bunkable changes

### Vacation Planner (`vacationPlanner.ts`)
Date-range vacation impact:
- `getVacationDays(start, end, holidays)` — maps dates to timetable day indices, marks Sundays
- `calculateVacationImpact()` — aggregates missed classes, per-subject projected %
- `findBestVacationWindows()` — scans 3/5/7-day windows, scores by weighted penalty, returns top 3 non-overlapping

### Utilities (`utils.ts`)
- `calculateClassesToBunk(attended, total, threshold)` — how many classes can be skipped
- `calculateClassesToAttend(attended, total, threshold)` — how many to attend to reach threshold
- `calculateStatus(percentage, threshold)` — safe/critical/low/no_data
- `getEffectiveThreshold(code, globalThreshold, subjectThresholds)` — per-subject or global

### Hooks
- `useAuth.ts` — Firebase `onAuthStateChanged` listener, returns `{user, loading}`
- `usePremium.ts` — computes `{isPremium, isTrial, canRefresh, refreshesLeft}` from premium dates + refresh count
- `useTheme.ts` — AsyncStorage-backed theme preference, returns `{theme, toggleTheme}`

## Conventions
- Timetable day indices: 0=Monday through 5=Saturday (NOT JS day convention)
- JS day convention: 0=Sunday through 6=Saturday
- Conversion: `timetableDayIndex = jsDay - 1` (Sunday has no timetable entry)
- Threshold default: 75%. Range: 50-95%
- Buffer zone: 5% above threshold (for "critical" status)
