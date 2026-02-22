import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';

export default function LoadingScreen() {
  const { dark, colors } = useThemeContext();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={dark ? require('../assets/logo-dark.png') : require('../assets/logo.png')} style={styles.logo} />
      <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 56, height: 56 },
  spinner: { marginTop: 24 },
});
