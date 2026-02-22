import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { PremiumStatus } from '../lib/usePremium';
import { PaymentRecord } from '../lib/firestore';
import { createPaymentOrder, verifyPayment } from '../lib/api';
import { openRazorpayCheckout } from '../lib/razorpay';

const INDIGO = '#6366f1';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  premiumStatus: PremiumStatus;
  uid: string;
  email: string;
  currentPremiumUntil: string | null;
  onPaymentSuccess: (premiumUntil: string, payment: PaymentRecord) => void;
}

interface FeatureRow {
  label: string;
  free: boolean;
  freeNote?: string;
  premium: boolean;
}

const FEATURES: FeatureRow[] = [
  { label: 'Dashboard & analytics', free: true, premium: true },
  { label: 'Global threshold', free: true, premium: true },
  { label: 'Monthly refreshes', free: true, freeNote: '3/month', premium: true },
  { label: 'Per-subject thresholds', free: false, premium: true },
  { label: 'Timetable scan & setup', free: false, premium: true },
  { label: 'Unlimited refreshes', free: false, premium: true },
];

export default function UpgradeModal({
  isOpen,
  onClose,
  premiumStatus,
  uid,
  email,
  currentPremiumUntil,
  onPaymentSuccess,
}: UpgradeModalProps) {
  const { dark, colors } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isPaidPremium, isTrialActive, premiumDaysLeft, trialDaysLeft } =
    premiumStatus;

  const handlePay = async () => {
    setError('');
    setLoading(true);

    try {
      // Step 1: Create order
      const orderResult = await createPaymentOrder(uid, email);
      if (!orderResult.ok) {
        setError(orderResult.error || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay checkout
      const razorpayResponse = await openRazorpayCheckout({
        orderId: orderResult.orderId!,
        amount: orderResult.amount!,
        currency: orderResult.currency!,
        email,
      });

      // Step 3: Verify payment
      const verifyResult = await verifyPayment(
        razorpayResponse.razorpay_order_id,
        razorpayResponse.razorpay_payment_id,
        razorpayResponse.razorpay_signature,
        uid,
        currentPremiumUntil,
      );

      if (!verifyResult.ok) {
        setError(verifyResult.error || 'Payment verification failed');
        setLoading(false);
        return;
      }

      // Step 4: Success
      onPaymentSuccess(
        verifyResult.premiumUntil!,
        verifyResult.payment as PaymentRecord,
      );
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Payment was cancelled or failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = isPaidPremium ? 'Renew \u2014 Rs 29' : 'Pay Rs 29';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: colors.background },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Upgrade to Premium
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: dark
                      ? 'rgba(100, 116, 139, 0.2)'
                      : 'rgba(148, 163, 184, 0.15)',
                  },
                ]}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Status banner */}
            {isPaidPremium ? (
              <View style={[styles.statusBanner, styles.statusBannerIndigo, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={colors.accent}
                />
                <Text style={[styles.statusBannerIndigoText, { color: colors.accent }]}>
                  Premium active \u2014 {premiumDaysLeft}{' '}
                  {premiumDaysLeft === 1 ? 'day' : 'days'} remaining
                </Text>
              </View>
            ) : isTrialActive && !isPaidPremium ? (
              <View style={[styles.statusBanner, styles.statusBannerAmber, { backgroundColor: dark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="time" size={18} color={dark ? '#fbbf24' : '#d97706'} />
                <Text style={[styles.statusBannerAmberText, { color: dark ? '#fbbf24' : '#d97706' }]}>
                  Free trial \u2014 {trialDaysLeft}{' '}
                  {trialDaysLeft === 1 ? 'day' : 'days'} left {'\u2022'} Unlimited refreshes
                </Text>
              </View>
            ) : null}

            {/* Plan comparison */}
            <View style={styles.plansContainer}>
              {/* Free plan */}
              <View
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.planName, { color: colors.text }]}>
                  Free
                </Text>
                <Text
                  style={[styles.planPrice, { color: colors.textSecondary }]}
                >
                  Rs 0
                </Text>
                <View style={[styles.planDivider, { backgroundColor: colors.divider }]} />
                {FEATURES.map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    <Ionicons
                      name={f.free ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={f.free ? (dark ? '#34d399' : '#10b981') : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.featureLabel,
                        {
                          color: f.free ? colors.text : colors.textTertiary,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {f.label}
                      {f.free && f.freeNote ? (
                        <Text style={styles.featureNote}>
                          {' '}({f.freeNote})
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Premium plan */}
              <View
                style={[
                  styles.planCard,
                  styles.premiumPlanCard,
                  {
                    backgroundColor: dark
                      ? 'rgba(165, 180, 252, 0.1)'
                      : 'rgba(99, 102, 241, 0.04)',
                    borderColor: dark
                      ? 'rgba(165, 180, 252, 0.35)'
                      : 'rgba(99, 102, 241, 0.3)',
                  },
                ]}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best value</Text>
                </View>
                <Text style={[styles.planName, { color: colors.text }]}>
                  Premium
                </Text>
                <Text style={[styles.planPrice, { color: colors.accent }]}>
                  Rs 29
                  <Text
                    style={[
                      styles.planPricePeriod,
                      { color: colors.textTertiary },
                    ]}
                  >
                    /mo
                  </Text>
                </Text>
                <View
                  style={[
                    styles.planDivider,
                    { backgroundColor: dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.15)' },
                  ]}
                />
                {FEATURES.map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={dark ? '#34d399' : '#10b981'}
                    />
                    <Text
                      style={[styles.featureLabel, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {f.label}
                      {f.label === 'Monthly refreshes' ? (
                        <Text style={[styles.featureNote, { color: colors.accent }]}>
                          {' '}(unlimited)
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Error display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Pay button */}
            <TouchableOpacity
              onPress={handlePay}
              disabled={loading}
              style={[
                styles.payButton,
                { backgroundColor: INDIGO, opacity: loading ? 0.7 : 1 },
              ]}
              accessibilityLabel={buttonLabel}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.payButtonText}>{buttonLabel}</Text>
              )}
            </TouchableOpacity>

            {/* Footer note */}
            <Text
              style={[styles.footerNote, { color: colors.textTertiary }]}
            >
              One-time payment for 30 days. No auto-renewal.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Status banners */
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusBannerIndigo: {
    // overridden inline for dark mode
  },
  statusBannerIndigoText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBannerAmber: {
    // overridden inline for dark mode
  },
  statusBannerAmberText: {
    // color set inline for dark mode
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  /* Plans */
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  premiumPlanCard: {
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: INDIGO,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 13,
  },
  bestValueText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  planPricePeriod: {
    fontSize: 13,
    fontWeight: '500',
  },
  planDivider: {
    height: 1,
    marginVertical: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  featureLabel: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  featureNote: {
    fontSize: 11,
    fontWeight: '500',
  },

  /* Error */
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  /* Pay button */
  payButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 12,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Footer */
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
