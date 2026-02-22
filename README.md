# UniTrack Mobile

Track your university attendance from any ERP portal. Know which classes you can safely skip.

**[Web version](https://unitrack-web.vercel.app)** | **[Web repo](https://github.com/0xMoni/UniTrack-web)**

## Features

- **Attendance Dashboard** — Subject-wise breakdown with color-coded status (safe / critical / low)
- **Smart Skip Calculator** — See how many classes you can skip per subject and still meet your threshold
- **Next Class Projections** — Instantly see what your percentage becomes if you attend or skip
- **Weekly Timetable** — Set up your schedule manually or scan your timetable image
- **Today's Classes** — Daily view with skip/attend/risky verdicts for each class
- **Week at a Glance** — Dot-based overview of the entire week's attendance health
- **Per-Subject Thresholds** — Set custom minimum attendance for individual subjects
- **Dark Mode** — Full dark theme with proper contrast across all components
- **Cloud Sync** — Firebase-backed data persistence across devices
- **Secure Credentials** — ERP passwords encrypted client-side with AES-GCM before storage
- **Auto Refresh** — Stale attendance data refreshes automatically on app launch

## Tech Stack

- **Framework** — React Native with Expo 54
- **Language** — TypeScript
- **Auth & Database** — Firebase Authentication + Cloud Firestore
- **Payments** — Razorpay (Rs 29/month premium)
- **Crypto** — react-native-quick-crypto (AES-GCM encryption)
- **Image Parsing** — AI-powered timetable extraction from photos

## Premium vs Free

| Feature | Free | Premium |
|---|---|---|
| Dashboard & analytics | Yes | Yes |
| Global attendance threshold | Yes | Yes |
| Monthly refreshes | 3/month | Unlimited |
| Per-subject thresholds | — | Yes |
| Timetable scan & setup | — | Yes |

New users get a 7-day trial with unlimited refreshes.

## Project Structure

```
├── App.tsx                  # Root component, state management, navigation
├── components/
│   ├── LoginScreen.tsx      # Auth + ERP credential forms
│   ├── Header.tsx           # App header with hamburger menu
│   ├── DashboardScreen.tsx  # Main dashboard layout
│   ├── StudentInfoCard.tsx  # Student name, USN, last updated
│   ├── OverallStatsCard.tsx # Aggregate stats + projections
│   ├── StatusFilter.tsx     # Filter by attendance status
│   ├── AttendanceCard.tsx   # Per-subject card with threshold editor
│   ├── TodayCard.tsx        # Today's classes with verdicts
│   ├── WeekOverview.tsx     # Week-at-a-glance dot grid
│   ├── ThresholdModal.tsx   # Global threshold picker
│   ├── TimetableSetup.tsx   # Manual + scan timetable setup
│   ├── UpgradeModal.tsx     # Premium plan comparison + payment
│   ├── PremiumGate.tsx      # Blur overlay for locked features
│   ├── PremiumBadge.tsx     # PRO/Upgrade badge
│   ├── ErrorToast.tsx       # Auto-dismissing error toast
│   └── LoadingScreen.tsx    # Splash/loading screen
├── contexts/
│   └── ThemeContext.tsx      # Dark/light theme with AsyncStorage
├── lib/
│   ├── api.ts               # Backend API calls
│   ├── firebase.ts          # Firebase config & initialization
│   ├── firestore.ts         # Firestore read/write helpers
│   ├── crypto.ts            # AES-GCM encrypt/decrypt
│   ├── razorpay.ts          # Razorpay checkout wrapper
│   ├── useAuth.ts           # Firebase auth hook
│   ├── usePremium.ts        # Premium status computation
│   ├── utils.ts             # Status calculations, color utilities
│   └── types.ts             # TypeScript interfaces
└── assets/
    ├── logo.png             # App logo (light mode)
    └── logo-dark.png        # App logo (dark mode)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)

### Setup

```bash
# Clone the repo
git clone https://github.com/0xMoni/UniTrack-app.git
cd UniTrack-app

# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Environment

The app requires Firebase and backend API configuration in `lib/config.ts` and `lib/firebase.ts`.

## License

MIT
