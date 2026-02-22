import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { useAuth } from './lib/useAuth';
import { usePremium } from './lib/usePremium';
import {
  loadUserData,
  saveUserData,
  saveErpCredentials,
  loadErpCredentials,
  incrementRefreshCount,
  savePayment,
  PaymentRecord,
} from './lib/firestore';
import { fetchAttendanceFromApi } from './lib/api';
import { AttendanceData, StatusFilter as StatusFilterType, Timetable } from './lib/types';
import LoadingScreen from './components/LoadingScreen';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import DashboardScreen from './components/DashboardScreen';
import ThresholdModal from './components/ThresholdModal';
import TimetableSetup from './components/TimetableSetup';
import UpgradeModal from './components/UpgradeModal';
import ErrorToast from './components/ErrorToast';

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

function AppContent() {
  const { dark, colors, loaded: themeLoaded } = useThemeContext();
  const { user, loading: authLoading, login, signUp, logout } = useAuth();

  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilterType>('all');
  const [savedUsername, setSavedUsername] = useState('');
  const [savedErpUrl, setSavedErpUrl] = useState('');
  const [threshold, setThreshold] = useState(75);
  const [subjectThresholds, setSubjectThresholds] = useState<Record<string, number>>({});
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [timetable, setTimetable] = useState<Timetable>({});
  const [showTimetableSetup, setShowTimetableSetup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const autoRefreshTriggered = useRef(false);

  // Premium state
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshCountResetMonth, setRefreshCountResetMonth] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const premiumStatus = usePremium({ premiumUntil, trialEndsAt, refreshCount, refreshCountResetMonth });

  // ── Load data from Firestore when user authenticates ──
  useEffect(() => {
    setAttendanceData(null);
    setSavedUsername('');
    setSavedErpUrl('');
    setActiveFilter('all');
    setThreshold(75);
    setSubjectThresholds({});
    setTimetable({});
    setPremiumUntil(null);
    setTrialEndsAt(null);
    setRefreshCount(0);
    setRefreshCountResetMonth('');
    setShowUpgradeModal(false);
    setIsInitialized(false);
    setIsAutoRefreshing(false);
    autoRefreshTriggered.current = false;
    setIsLoading(false);
    setError(null);
    setAuthError(null);

    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await loadUserData(user.uid);
        if (cancelled) return;

        if (data.attendance) setAttendanceData(data.attendance);
        if (data.threshold) setThreshold(data.threshold);
        if (data.subjectThresholds) setSubjectThresholds(data.subjectThresholds);
        if (data.timetable) setTimetable(data.timetable);
        if (data.erpUrl) setSavedErpUrl(data.erpUrl);
        if (data.premiumUntil) setPremiumUntil(data.premiumUntil);
        if (data.trialEndsAt) setTrialEndsAt(data.trialEndsAt);
        if (data.refreshCount) setRefreshCount(data.refreshCount);
        if (data.refreshCountResetMonth) setRefreshCountResetMonth(data.refreshCountResetMonth);
      } catch {
        // Firestore load failed — user will see empty state
      }

      if (!cancelled) setIsInitialized(true);
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Save attendance to Firestore when it changes ──
  useEffect(() => {
    if (!isInitialized || !user || !attendanceData) return;
    saveUserData(user.uid, {
      attendance: attendanceData,
      lastSynced: new Date().toISOString(),
    });
  }, [attendanceData, isInitialized, user]);

  // ── Save threshold to Firestore when it changes ──
  useEffect(() => {
    if (!isInitialized || !user) return;
    saveUserData(user.uid, { threshold });
  }, [threshold, isInitialized, user]);

  // ── Save subject thresholds to Firestore when they change ──
  useEffect(() => {
    if (!isInitialized || !user) return;
    saveUserData(user.uid, { subjectThresholds });
  }, [subjectThresholds, isInitialized, user]);

  // ── Save timetable to Firestore when it changes ──
  useEffect(() => {
    if (!isInitialized || !user) return;
    saveUserData(user.uid, { timetable });
  }, [timetable, isInitialized, user]);

  // ── Auth handlers ──
  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('auth/email-already-in-use')) setAuthError('This email is already registered. Try signing in.');
      else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) setAuthError('Invalid email or password.');
      else if (msg.includes('auth/weak-password')) setAuthError('Password must be at least 6 characters.');
      else if (msg.includes('auth/invalid-email')) setAuthError('Please enter a valid email address.');
      else if (msg.includes('auth/too-many-requests')) setAuthError('Too many attempts. Try again later.');
      else setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch attendance from ERP ──
  const fetchAttendance = useCallback(async (erpUrl: string, username: string, password: string) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAttendanceFromApi(erpUrl, username, password, threshold);

      if (result.success && result.data) {
        const isFirstFetch = !attendanceData;
        setAttendanceData(result.data);
        setSavedUsername(username);
        setSavedErpUrl(erpUrl);

        try {
          await saveErpCredentials(user.uid, erpUrl, username, password);
        } catch (saveErr) {
          console.error('Failed to save ERP credentials:', saveErr);
        }

        if (!isFirstFetch && !premiumStatus.isPremium) {
          const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          const updated = await incrementRefreshCount(user.uid, currentMonth, refreshCount, refreshCountResetMonth);
          setRefreshCount(updated.refreshCount);
          setRefreshCountResetMonth(updated.refreshCountResetMonth);
        }
      } else {
        setError(result.error || 'Failed to fetch attendance data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — check your connection');
    } finally {
      setIsLoading(false);
    }
  }, [threshold, user, attendanceData, premiumStatus.isPremium, refreshCount, refreshCountResetMonth]);

  // ── Auto-refresh callback ──
  const autoRefresh = useCallback(async () => {
    if (!user || !attendanceData || !premiumStatus.canRefresh) return;

    setIsAutoRefreshing(true);
    try {
      const creds = await loadErpCredentials(user.uid);
      if (!creds) return;

      const result = await fetchAttendanceFromApi(creds.erpUrl, creds.username, creds.password, threshold);

      if (result.success && result.data) {
        setAttendanceData(result.data);

        if (!premiumStatus.isPremium) {
          const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          const updated = await incrementRefreshCount(user.uid, currentMonth, refreshCount, refreshCountResetMonth);
          setRefreshCount(updated.refreshCount);
          setRefreshCountResetMonth(updated.refreshCountResetMonth);
        }
      }
    } catch {
      setError('Auto-refresh failed — pull down to try again');
    } finally {
      setIsAutoRefreshing(false);
    }
  }, [user, attendanceData, premiumStatus.canRefresh, premiumStatus.isPremium, threshold, refreshCount, refreshCountResetMonth]);

  // ── Trigger auto-refresh once after initialization if data is stale ──
  useEffect(() => {
    if (!isInitialized || !attendanceData || autoRefreshTriggered.current) return;
    autoRefreshTriggered.current = true;

    const lastUpdated = new Date(attendanceData.lastUpdated).getTime();
    const age = Date.now() - lastUpdated;

    if (age > STALE_THRESHOLD_MS) {
      autoRefresh();
    }
  }, [isInitialized, attendanceData, autoRefresh]);

  // ── Logout ──
  const handleLogout = async () => {
    setAttendanceData(null);
    setSavedUsername('');
    setSavedErpUrl('');
    setActiveFilter('all');
    setThreshold(75);
    setSubjectThresholds({});
    setTimetable({});
    setPremiumUntil(null);
    setTrialEndsAt(null);
    setRefreshCount(0);
    setRefreshCountResetMonth('');
    setShowUpgradeModal(false);
    setIsInitialized(false);
    await logout();
  };

  const handleThresholdSave = (newThreshold: number) => {
    setThreshold(newThreshold);
  };

  const handlePaymentSuccess = async (newPremiumUntil: string, payment: PaymentRecord) => {
    setPremiumUntil(newPremiumUntil);
    if (user) {
      await savePayment(user.uid, newPremiumUntil, payment);
    }
  };

  const handleSubjectThresholdChange = (subjectKey: string, value: number | null) => {
    setSubjectThresholds(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[subjectKey];
      } else {
        next[subjectKey] = value;
      }
      return next;
    });
  };

  // ── Loading state ──
  if (!themeLoaded || authLoading) {
    return <LoadingScreen />;
  }

  // ── Not logged in → Auth form ──
  if (!user) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBarStyle} />
        <LoginScreen
          mode="auth"
          onAuth={handleAuth}
          isLoading={isLoading}
          authError={authError || undefined}
        />
      </View>
    );
  }

  // ── Logged in but Firestore data still loading ──
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // ── Logged in but no attendance data → ERP connection form ──
  if (!attendanceData) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBarStyle} />
        <LoginScreen
          mode="erp"
          onSubmit={fetchAttendance}
          isLoading={isLoading}
          savedUsername={savedUsername}
          savedErpUrl={savedErpUrl}
          onLogout={handleLogout}
        />
        <View style={styles.errorContainer}>
          <ErrorToast message={error} onDismiss={() => setError(null)} />
        </View>
      </View>
    );
  }

  // ── Dashboard ──
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <SafeAreaView style={styles.flex}>
        <Header
          premiumStatus={premiumStatus}
          onUpgradePress={() => setShowUpgradeModal(true)}
          onTimetablePress={() => premiumStatus.isPaidPremium ? setShowTimetableSetup(true) : setShowUpgradeModal(true)}
          onSettingsPress={() => setShowThresholdModal(true)}
          onLogoutPress={handleLogout}
        />
        <DashboardScreen
          attendanceData={attendanceData}
          threshold={threshold}
          subjectThresholds={subjectThresholds}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          timetable={timetable}
          premiumStatus={premiumStatus}
          isAutoRefreshing={isAutoRefreshing}
          onThresholdModalOpen={() => setShowThresholdModal(true)}
          onTimetableSetupOpen={() => setShowTimetableSetup(true)}
          onUpgradeModalOpen={() => setShowUpgradeModal(true)}
          onSubjectThresholdChange={handleSubjectThresholdChange}
        />
      </SafeAreaView>

      {/* Modals */}
      <ThresholdModal
        isOpen={showThresholdModal}
        currentThreshold={threshold}
        onClose={() => setShowThresholdModal(false)}
        onSave={handleThresholdSave}
      />

      <TimetableSetup
        isOpen={showTimetableSetup}
        onClose={() => setShowTimetableSetup(false)}
        onSave={setTimetable}
        subjects={attendanceData.subjects}
        currentTimetable={timetable}
        isPremium={premiumStatus.isPaidPremium}
        onUpgradePress={() => { setShowTimetableSetup(false); setShowUpgradeModal(true); }}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        premiumStatus={premiumStatus}
        uid={user.uid}
        email={user.email || ''}
        currentPremiumUntil={premiumUntil}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Error toast */}
      <View style={styles.errorContainer}>
        <ErrorToast message={error} onDismiss={() => setError(null)} />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
});
