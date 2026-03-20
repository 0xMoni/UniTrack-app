import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../contexts/ThemeContext';
import { PremiumStatus } from '../lib/usePremium';

const THEME_HINT_KEY = '@unitrack_theme_hint_shown';

interface HeaderProps {
  premiumStatus: PremiumStatus;
  onUpgradePress: () => void;
  onTimetablePress: () => void;
  onSettingsPress: () => void;
  onLogoutPress: () => void;
}

const INDIGO = '#6366f1';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function Header({
  premiumStatus,
  onUpgradePress,
  onTimetablePress,
  onSettingsPress,
  onLogoutPress,
}: HeaderProps) {
  const { dark, colors, toggle } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showThemeHint, setShowThemeHint] = useState(false);
  const hintFade = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  // Show theme hint once
  useEffect(() => {
    AsyncStorage.getItem(THEME_HINT_KEY).then((val) => {
      if (!val) {
        setTimeout(() => {
          setShowThemeHint(true);
          Animated.timing(hintFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }, 1500);
      }
    });
  }, [hintFade]);

  const dismissHint = () => {
    Animated.timing(hintFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShowThemeHint(false);
      AsyncStorage.setItem(THEME_HINT_KEY, 'true').catch(() => {});
    });
  };

  useEffect(() => {
    if (menuOpen && showThemeHint) dismissHint();
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-8);
    }
  }, [menuOpen, fadeAnim, slideAnim]);

  const closeMenu = () => setMenuOpen(false);

  const menuItems: MenuItem[] = [
    ...(premiumStatus.isPaidPremium
      ? []
      : [{ icon: 'sparkles' as const, label: 'Upgrade to Pro', onPress: onUpgradePress }]),
    { icon: 'calendar-outline' as const, label: 'Timetable', onPress: onTimetablePress },
    { icon: 'settings-outline' as const, label: 'Settings', onPress: onSettingsPress },
    { icon: 'log-out-outline' as const, label: 'Log Out', onPress: onLogoutPress, destructive: true },
  ];

  const handleItemPress = (item: MenuItem) => {
    closeMenu();
    // Small delay so the menu closes visually before the action
    setTimeout(item.onPress, 150);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder, paddingTop: insets.top + 8 },
        ]}
      >
        <View style={styles.left}>
          <Image source={dark ? require('../assets/logo-dark.png') : require('../assets/logo.png')} style={styles.logo} />
          <Text style={[styles.title, { color: colors.text }]}>UniTrack</Text>
          <View style={[styles.planBadge, { backgroundColor: premiumStatus.isPaidPremium ? INDIGO : (dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)') }]}>
            <Text style={[styles.planBadgeText, { color: premiumStatus.isPaidPremium ? '#ffffff' : colors.accent }]}>
              {premiumStatus.isPaidPremium ? 'PRO' : 'FREE'}
            </Text>
          </View>
        </View>

        <View style={styles.rightButtons}>
          <TouchableOpacity
            onPress={() => { toggle(); if (showThemeHint) dismissHint(); }}
            style={[styles.themeToggle, { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            accessibilityRole="button"
          >
            <Ionicons name={dark ? 'sunny' : 'moon'} size={18} color={dark ? '#fbbf24' : '#6366f1'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={[styles.menuButton, { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showThemeHint && (
            <Animated.View style={[styles.themeHint, { opacity: hintFade, backgroundColor: dark ? '#1e293b' : '#ffffff', borderColor: dark ? 'rgba(165, 180, 252, 0.3)' : 'rgba(99, 102, 241, 0.2)' }]}>
              <Ionicons name={dark ? 'sunny' : 'moon'} size={14} color={colors.accent} />
              <Text style={[styles.themeHintText, { color: colors.text }]}>
                Try {dark ? 'light' : 'dark'} mode!
              </Text>
              <TouchableOpacity onPress={dismissHint} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <Pressable style={[styles.backdrop, { paddingTop: insets.top + 52 }]} onPress={closeMenu}>
          <Animated.View
            style={[
              styles.menu,
              {
                backgroundColor: dark ? '#1e293b' : '#ffffff',
                borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {menuItems.map((item) => (
              <React.Fragment key={item.label}>
                {item.destructive && <View style={[styles.separator, { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />}
                <TouchableOpacity
                  onPress={() => handleItemPress(item)}
                  style={styles.menuItem}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.destructive ? (dark ? '#f87171' : '#ef4444') : (dark ? '#cbd5e1' : '#64748b')}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: item.destructive ? (dark ? '#f87171' : '#ef4444') : (dark ? '#f1f5f9' : '#1e293b') },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  menu: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    minWidth: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginHorizontal: 12,
    marginVertical: 2,
  },
  themeHint: {
    position: 'absolute',
    top: 44,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    zIndex: 100,
  },
  themeHintArrow: {
    position: 'absolute',
    top: -6,
    right: 12,
    width: 12,
    height: 6,
    overflow: 'hidden',
  },
  themeHintArrowInner: {
    position: 'absolute',
    top: 3,
    left: 0,
    width: 10,
    height: 10,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  themeHintText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
