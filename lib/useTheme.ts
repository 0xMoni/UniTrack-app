import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'unitrack_theme';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [dark, setDark] = useState(systemScheme === 'dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'dark') setDark(true);
      else if (saved === 'light') setDark(false);
      else setDark(systemScheme === 'dark');
      setLoaded(true);
    });
  }, [systemScheme]);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { dark, toggle, loaded };
}
