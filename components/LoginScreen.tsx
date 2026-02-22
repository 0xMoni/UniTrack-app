import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../contexts/ThemeContext';

const FUNNY_MESSAGES = [
  'Connecting to ERP...',
  'Praying to the attendance gods...',
  'Bribing the ERP hamsters...',
  'Decoding ancient ERP scrolls...',
  'Negotiating with the server...',
  'Warming up the attendance engine...',
  'Asking ERP nicely...',
  'Performing dark rituals...',
  'Counting every present and absent...',
  'Almost there, probably...',
];

const PRIMARY = '#6366f1';

type AuthProps = {
  mode: 'auth';
  onAuth: (email: string, password: string, isSignUp: boolean) => void;
  isLoading: boolean;
  authError?: string;
};

type ErpProps = {
  mode: 'erp';
  onSubmit: (erpUrl: string, username: string, password: string) => void;
  isLoading: boolean;
  savedUsername?: string;
  savedErpUrl?: string;
  onLogout: () => void;
};

type Props = AuthProps | ErpProps;

export default function LoginScreen(props: Props) {
  const { dark, colors } = useThemeContext();
  const { mode, isLoading } = props;

  // Auth mode state
  const [email, setEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  // ERP mode state
  const [erpUrl, setErpUrl] = useState('');
  const [username, setUsername] = useState('');
  const [erpPassword, setErpPassword] = useState('');
  const [showErpPassword, setShowErpPassword] = useState(false);

  // Funny loading message rotation
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill saved values for ERP mode
  useEffect(() => {
    if (mode === 'erp') {
      if (props.savedErpUrl) setErpUrl(props.savedErpUrl);
      if (props.savedUsername) setUsername(props.savedUsername);
    }
  }, [mode, mode === 'erp' ? props.savedErpUrl : null, mode === 'erp' ? props.savedUsername : null]);

  // Rotate funny messages while loading
  useEffect(() => {
    if (isLoading) {
      setMessageIndex(0);
      intervalRef.current = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading]);

  const [localError, setLocalError] = useState('');

  const handleAuthSubmit = () => {
    if (mode !== 'auth') return;
    setLocalError('');
    if (!email.trim()) { setLocalError('Please enter your email address.'); return; }
    if (!authPassword) { setLocalError('Please enter your password.'); return; }
    props.onAuth(email.trim(), authPassword, isSignUp);
  };

  const handleErpSubmit = () => {
    if (mode !== 'erp') return;
    setLocalError('');
    if (!erpUrl.trim()) { setLocalError('Please enter your ERP URL.'); return; }
    if (!username.trim()) { setLocalError('Please enter your username.'); return; }
    if (!erpPassword) { setLocalError('Please enter your password.'); return; }
    props.onSubmit(erpUrl.trim(), username.trim(), erpPassword);
  };

  const errorMessage = localError || (mode === 'auth' ? props.authError : undefined);

  const renderPasswordField = (
    value: string,
    onChangeText: (t: string) => void,
    visible: boolean,
    onToggle: () => void,
    placeholder: string,
  ) => (
    <View style={styles.passwordWrapper}>
      <TextInput
        style={[
          styles.input,
          styles.passwordInput,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
      >
        <Text style={[styles.eyeText, { color: colors.textSecondary }]}>
          {visible ? 'Hide' : 'Show'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and title */}
          <View style={styles.header}>
            <Image source={dark ? require('../assets/logo-dark.png') : require('../assets/logo.png')} style={styles.logo} />
            <Text style={[styles.title, { color: colors.text }]}>UniTrack</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Attendance Tracker
            </Text>
          </View>

          {/* Form card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            {/* Loading overlay */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={[styles.loadingMessage, { color: colors.textSecondary }]}>
                  {FUNNY_MESSAGES[messageIndex]}
                </Text>
              </View>
            ) : (
              <>
                {/* Error message */}
                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {mode === 'auth' ? (
                  <>
                    {/* Email */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      editable={!isLoading}
                    />

                    {/* Password */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                    {renderPasswordField(
                      authPassword,
                      setAuthPassword,
                      showAuthPassword,
                      () => setShowAuthPassword((v) => !v),
                      'Enter your password',
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: PRIMARY }]}
                      onPress={handleAuthSubmit}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={isSignUp ? 'Create Account' : 'Sign In'}
                    >
                      <Text style={styles.buttonText}>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>

                    {/* Toggle sign in / sign up */}
                    <TouchableOpacity
                      style={styles.toggleLink}
                      onPress={() => setIsSignUp((v) => !v)}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                        {isSignUp
                          ? 'Already have an account? '
                          : "Don't have an account? "}
                        <Text style={[styles.toggleTextAccent, { color: colors.accent }]}>
                          {isSignUp ? 'Sign In' : 'Create Account'}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* ERP URL */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>ERP URL</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      placeholder="https://erp.example.com"
                      placeholderTextColor={colors.textTertiary}
                      value={erpUrl}
                      onChangeText={setErpUrl}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />

                    {/* Username */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Enter your username"
                      placeholderTextColor={colors.textTertiary}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />

                    {/* Password */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                    {renderPasswordField(
                      erpPassword,
                      setErpPassword,
                      showErpPassword,
                      () => setShowErpPassword((v) => !v),
                      'Enter your password',
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: PRIMARY }]}
                      onPress={handleErpSubmit}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Fetch My Attendance"
                    >
                      <Text style={styles.buttonText}>Fetch My Attendance</Text>
                    </TouchableOpacity>

                    {/* Sign out */}
                    <TouchableOpacity
                      style={styles.toggleLink}
                      onPress={(props as ErpProps).onLogout}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.toggleText, styles.toggleTextAccent, { color: colors.accent }]}>Sign out</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>

          {/* Footer */}
          {mode === 'erp' && (
            <Text style={[styles.footer, { color: colors.textTertiary }]}>
              Your credentials are sent directly to the ERP server and are never stored on our
              servers.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },

  /* Card */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },

  /* Labels and inputs */
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    paddingVertical: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Button */
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 48,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Toggle link */
  toggleLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  toggleTextAccent: {
    fontWeight: '600',
  },

  /* Loading */
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingMessage: {
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
  },

  /* Error */
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  /* Footer */
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
