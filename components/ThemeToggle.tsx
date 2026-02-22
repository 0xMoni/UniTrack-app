import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  dark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.button} activeOpacity={0.7}>
      <Ionicons
        name={dark ? 'sunny' : 'moon'}
        size={20}
        color={dark ? '#fbbf24' : '#475569'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 12,
  },
});
