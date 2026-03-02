# Components - Development Context

## Overview
All UI components for UniTrack. Uses React Native primitives with Expo vector icons. Theming via `useThemeContext()` which provides `dark` boolean and `colors` object.

## Component Hierarchy
```
App.tsx
├── LoadingScreen          # Initial load / auth check
├── LoginScreen            # Auth + ERP credential entry
└── DashboardScreen        # Main app (authenticated)
    ├── Header             # Top bar (theme, settings, upgrade)
    ├── StudentInfoCard    # Name + roll number
    ├── OverallStatsCard   # Aggregate attendance %
    ├── TodayCard          # Today's classes + skip verdict
    ├── WeekOverview       # 7-day color dots
    ├── StatusFilter       # Safe/critical/low filter chips
    ├── AttendanceCard[]   # Per-subject cards (mapped)
    ├── PremiumGate        # Blur wrapper for premium features
    │   ├── VacationPlanner  # Date-range impact planner
    │   └── SkipDayPlanner   # Day-based skip scoring
    ├── ThresholdModal     # Global threshold slider (modal)
    ├── TimetableSetup     # Schedule input (modal)
    └── UpgradeModal       # Razorpay payment (modal)
```

## Patterns
- **Styling:** `StyleSheet.create()` at bottom of each file. Card base: `borderRadius: 16, borderWidth: 1, padding: 16`.
- **Theme colors:** Always destructure `const { dark, colors } = useThemeContext()`. Use `colors.card`, `colors.cardBorder`, `colors.text`, `colors.textSecondary`, `colors.textTertiary`, `colors.accent`.
- **No LayoutAnimation:** Removed due to Android crashes. Use simple state toggles for expand/collapse.
- **Premium gating:** Wrap premium UI in `<PremiumGate>`. The gate blurs content and shows an upgrade button.
- **Icons:** `<Ionicons>` from `@expo/vector-icons`. Common: `chevron-down`, `warning`, `sparkles`, `calendar-outline`.

## Key Components

### DashboardScreen
Main container. Manages pull-to-refresh, passes attendance data to child components. Imports VacationPlanner (premium) and SkipDayPlanner (premium).

### AttendanceCard
Most complex card. Shows subject name, attendance %, animated progress bar, class counts, and bunkable/attend-to-reach calculations. Premium users get inline per-subject threshold slider.

### TodayCard
Shows today's classes based on timetable. Has day selector tabs (Today / Tomorrow / Day After). Renders skip verdicts per class. Shows fun rotating messages on Sundays (Today tab only).

### VacationPlanner
Date-range planner. Uses CalendarPicker for inline month calendar. Shows holiday toggles for each day in range (Sundays auto-excluded with label). Calculates per-subject impact. "Find best windows" button scans upcoming weeks.

### CalendarPicker
Inline month calendar. Props: `startDate, endDate, onSelectDate, holidays, onToggleHoliday, minDate`. Tap logic: first tap = start, second tap = end, third = reset. Past dates disabled. Sundays selectable but visually muted.

### TimetableSetup
Two modes: manual day/subject grid entry, or image upload with AI parsing via backend `/api/parse-timetable`.

### UpgradeModal
Feature comparison table + Razorpay checkout. Calls `/api/payments/create-order` then opens Razorpay, then `/api/payments/verify-payment`.
