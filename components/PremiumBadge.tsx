import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { PremiumStatus } from '../lib/usePremium';

interface PremiumBadgeProps {
  status: PremiumStatus;
  onUpgradePress: () => void;
}

export default function PremiumBadge({ status, onUpgradePress }: PremiumBadgeProps) {
  const { dark, colors } = useThemeContext();
  const badgeBg = dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)';

  if (status.isPaidPremium) {
    return (
      <Text style={[styles.proBadge, { color: colors.accent, backgroundColor: badgeBg }]}>PRO</Text>
    );
  }

  return (
    <TouchableOpacity onPress={onUpgradePress} style={[styles.upgradeButton, { backgroundColor: badgeBg }]}>
      <Text style={[styles.upgradeText, { color: colors.accent }]}>Upgrade</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  upgradeButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
