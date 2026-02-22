import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export default function ErrorToast({ message, onDismiss, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons
        name="alert-circle-outline"
        size={22}
        color="#ffffff"
        style={styles.icon}
      />

      <View style={styles.textColumn}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onDismiss}
        style={styles.closeButton}
        activeOpacity={0.7}
        accessibilityLabel="Dismiss error"
        accessibilityRole="button"
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons name="close" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    marginRight: 12,
    marginTop: 1,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
