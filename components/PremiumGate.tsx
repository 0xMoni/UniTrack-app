import React, { ReactNode } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';

interface PremiumGateProps {
  isPremium: boolean;
  onUpgradePress: () => void;
  children: ReactNode;
}

export default function PremiumGate({ isPremium, onUpgradePress, children }: PremiumGateProps) {
  const { dark } = useThemeContext();

  if (isPremium) return <>{children}</>;

  return (
    <View style={styles.container}>
      <View style={styles.blurredContent} pointerEvents="none">
        {children}
      </View>
      <View style={styles.overlay}>
        <TouchableOpacity
          onPress={onUpgradePress}
          style={[styles.button, { backgroundColor: dark ? '#1e293b' : '#ffffff' }]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to unlock features"
        >
          <Ionicons name="lock-closed" size={16} color={dark ? '#a5b4fc' : '#6366f1'} />
          <Text style={[styles.buttonText, { color: dark ? '#f1f5f9' : '#0f172a' }]}>Upgrade to unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  blurredContent: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
