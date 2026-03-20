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
  onPaymentSuccess: (premiumUntil: string, payment: PaymentRecord) => Promise<void>;
}

const PREMIUM_FEATURES = [
  'Unlimited refreshes',
  'Per-subject thresholds',
  'Timetable scan & setup',
  "Today's skip advice",
  'Vacation planner',
];

interface BenefitItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}

const BENEFITS: BenefitItem[] = [
  {
    icon: 'checkmark-circle',
    title: 'Know which classes to skip',
    desc: 'Daily verdict — safe, risky, or must attend.',
  },
  {
    icon: 'airplane',
    title: 'Plan vacations without fear',
    desc: 'See exactly how time off impacts each subject.',
  },
  {
    icon: 'refresh',
    title: 'Unlimited refreshes',
    desc: 'Free users get 3/month. Stay updated daily.',
  },
  {
    icon: 'options',
    title: 'Per-subject thresholds',
    desc: 'Set custom minimums — 85% for some, 50% for others.',
  },
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

  // Clear stale error every time modal opens
  React.useEffect(() => {
    if (isOpen) setError('');
  }, [isOpen]);

  const handlePay = async () => {
    setError('');
    setLoading(true);

    try {
      const orderResult = await createPaymentOrder(uid, email);
      if (!orderResult.ok) {
        setError(orderResult.error || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      const razorpayResponse = await openRazorpayCheckout({
        orderId: orderResult.orderId!,
        amount: orderResult.amount!,
        currency: orderResult.currency!,
        email,
      });

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

      await onPaymentSuccess(
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

  const buttonLabel = isPaidPremium ? 'Renew \u2014 Rs 19' : 'Pay Rs 19';

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
          {/* Scrollable content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Skip smarter, not harder
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Pro makes sure you never accidentally drop below threshold.
                </Text>
              </View>
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
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Status banner */}
            {isPaidPremium ? (
              <View style={[styles.statusBanner, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
                <Text style={[styles.statusBannerText, { color: colors.accent }]}>
                  Premium active — {premiumDaysLeft} {premiumDaysLeft === 1 ? 'day' : 'days'} remaining
                </Text>
              </View>
            ) : isTrialActive ? (
              <View style={[styles.statusBanner, { backgroundColor: dark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="time" size={16} color={dark ? '#fbbf24' : '#d97706'} />
                <Text style={[styles.statusBannerText, { color: dark ? '#fbbf24' : '#d97706' }]}>
                  Free trial — {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
                </Text>
              </View>
            ) : null}

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              {BENEFITS.map((b) => (
                <View key={b.title} style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
                    <Ionicons name={b.icon} size={16} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitTitle, { color: colors.text }]}>{b.title}</Text>
                    <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* What you get — compact list instead of two huge cards */}
            <View style={[styles.premiumCard, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.08)' : 'rgba(99, 102, 241, 0.04)', borderColor: dark ? 'rgba(165, 180, 252, 0.25)' : 'rgba(99, 102, 241, 0.2)' }]}>
              <View style={styles.premiumCardHeader}>
                <Text style={[styles.premiumCardTitle, { color: colors.text }]}>Premium</Text>
                <Text style={[styles.premiumCardPrice, { color: colors.accent }]}>
                  Rs 19<Text style={[styles.premiumCardPeriod, { color: colors.textTertiary }]}>/mo</Text>
                </Text>
              </View>
              <View style={styles.premiumFeatureList}>
                {PREMIUM_FEATURES.map((f) => (
                  <View key={f} style={styles.premiumFeatureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={dark ? '#34d399' : '#10b981'} />
                    <Text style={[styles.premiumFeatureText, { color: colors.text }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.freeNote, { color: colors.textTertiary }]}>
                Free plan includes dashboard, global threshold, and 3 refreshes/month
              </Text>
            </View>
          </ScrollView>

          {/* Fixed bottom — always visible */}
          <View style={[styles.bottomBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
            {error ? (
              <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
            ) : null}

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
                <View style={styles.payButtonContent}>
                  <Text style={styles.payButtonText}>{buttonLabel}</Text>
                  <Text style={styles.payButtonSub}>30 days · No auto-renewal · Less than Rs 1/day</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 8,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Status banners */
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  /* Benefits */
  benefitsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },

  /* Premium card (replaces two-column comparison) */
  premiumCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  premiumCardPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  premiumCardPeriod: {
    fontSize: 13,
    fontWeight: '500',
  },
  premiumFeatureList: {
    gap: 8,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumFeatureText: {
    fontSize: 13,
    fontWeight: '500',
  },
  freeNote: {
    fontSize: 11,
    marginTop: 12,
    lineHeight: 16,
  },

  /* Fixed bottom bar */
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  payButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  payButtonContent: {
    alignItems: 'center',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  payButtonSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
