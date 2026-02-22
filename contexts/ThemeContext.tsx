import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme } from '../lib/useTheme';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  headerBorder: string;
  divider: string;
  statusBarStyle: 'light' | 'dark';
}

const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  accent: '#6366f1',
  inputBg: '#f8fafc',
  inputBorder: '#e2e8f0',
  headerBg: 'rgba(255, 255, 255, 0.8)',
  headerBorder: '#e2e8f0',
  divider: '#e2e8f0',
  statusBarStyle: 'dark',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  card: '#1e293b',
  cardBorder: '#334155',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  accent: '#a5b4fc',
  inputBg: '#1e293b',
  inputBorder: '#475569',
  headerBg: 'rgba(15, 23, 42, 0.95)',
  headerBorder: '#334155',
  divider: '#334155',
  statusBarStyle: 'light',
};

interface ThemeContextValue {
  dark: boolean;
  colors: ThemeColors;
  toggle: () => void;
  loaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  colors: lightColors,
  toggle: () => {},
  loaded: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { dark, toggle, loaded } = useTheme();
  const colors = dark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ dark, colors, toggle, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
