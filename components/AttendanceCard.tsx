import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject } from '../lib/types';
import {
  calculateStatus,
  calculateClassesToBunk,
  calculateClassesToAttend,
  getStatusHexColor,
  getStatusBgRgba,
  getStatusBorderColor,
} from '../lib/utils';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INDIGO = '#6366f1';
const SLIDER_TRACK_HEIGHT = 32;
const SLIDER_THUMB_SIZE = 24;
const SLIDER_MIN = 50;
const SLIDER_MAX = 95;

interface AttendanceCardProps {
  subject: Subject;
  threshold: number;
  hasCustomThreshold: boolean;
  onThresholdChange: (value: number | null) => void;
  isPremium?: boolean;
  onUpgradePress?: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function AttendanceCard({
  subject,
  threshold,
  hasCustomThreshold,
  onThresholdChange,
  isPremium = false,
  onUpgradePress,
}: AttendanceCardProps) {
  const { dark, colors } = useThemeContext();
  const [editing, setEditing] = useState(false);
  const [sliderValue, setSliderValue] = useState(threshold);
  const [sliderWidth, setSliderWidth] = useState(0);
  const fillAnim = useRef(new Animated.Value(0)).current;

  const { name, code, attended, total, percentage } = subject;
  const status = calculateStatus(percentage, threshold, total);
  const statusColor = getStatusHexColor(status, dark);
  const missed = total - attended;

  // Animated progress bar fill
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: total > 0 ? percentage : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage, total, fillAnim]);

  // Sync slider when threshold prop changes externally
  useEffect(() => {
    if (!editing) {
      setSliderValue(threshold);
    }
  }, [threshold, editing]);

  // Next class projections
  const attendNext =
    total > 0 ? parseFloat((((attended + 1) / (total + 1)) * 100).toFixed(1)) : 100;
  const skipNext =
    total > 0 ? parseFloat(((attended / (total + 1)) * 100).toFixed(1)) : 0;

  // Status message
  function getStatusMessage(): string {
    switch (status) {
      case 'no_data':
        return 'No classes conducted yet';
      case 'safe': {
        const canBunk = calculateClassesToBunk(attended, total, threshold);
        return `You can skip ${canBunk} more class${canBunk !== 1 ? 'es' : ''}`;
      }
      case 'critical':
        return "At threshold \u2014 don't miss any classes";
      case 'low': {
        const needed = calculateClassesToAttend(attended, total, threshold);
        return `Attend ${needed} more class${needed !== 1 ? 'es' : ''} to reach ${threshold}%`;
      }
    }
  }

  function handleThresholdBadgePress() {
    if (isPremium) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSliderValue(threshold);
      setEditing(true);
    } else if (onUpgradePress) {
      onUpgradePress();
    }
  }

  function handleResetThreshold() {
    onThresholdChange(null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditing(false);
  }

  function handleSliderCommit() {
    onThresholdChange(sliderValue);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditing(false);
  }

  function handleSliderGesture(locationX: number) {
    const ratio = clamp(locationX / sliderWidth, 0, 1);
    const raw = SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN);
    setSliderValue(Math.round(raw));
  }

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const trackBgColor = dark ? '#334155' : '#e2e8f0';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getStatusBgRgba(status, 0.12, dark),
          borderColor: getStatusBorderColor(status, dark),
        },
      ]}
    >
      {/* Content */}
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text
              style={[styles.subjectName, { color: colors.text }]}
              numberOfLines={2}
            >
              {name}
            </Text>
            {code ? (
              <Text style={[styles.subjectCode, { color: colors.textTertiary }]}>
                {code}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.percentage, { color: statusColor }]}>
            {total > 0 ? `${parseFloat(percentage.toFixed(1))}%` : '--'}
          </Text>
        </View>

        {/* Details row */}
        {total > 0 ? (
          <View style={styles.detailsRow}>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {attended}/{total} attended
            </Text>
            <Text style={[styles.detailText, { color: colors.textTertiary }]}>
              {'  '}{missed} missed
            </Text>
          </View>
        ) : null}

        {/* Status message */}
        <Text style={[styles.statusMessage, { color: statusColor }]}>
          {getStatusMessage()}
        </Text>

        {/* Next class projection */}
        {total > 0 ? (
          <View style={styles.projectionRow}>
            <Text style={[styles.projectionLabel, { color: colors.textTertiary }]}>
              Next class: attend{' '}
            </Text>
            <Text style={[styles.projectionLabel, { color: dark ? '#34d399' : '#10b981' }]}>
              {'\u2192'} {attendNext}%
            </Text>
            <Text style={[styles.projectionLabel, { color: colors.textTertiary }]}>
              {' | skip '}
            </Text>
            <Text style={[styles.projectionLabel, { color: dark ? '#f87171' : '#ef4444' }]}>
              {'\u2192'} {skipNext}%
            </Text>
          </View>
        ) : null}

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressTrack, { backgroundColor: trackBgColor }]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: statusColor,
                  width: fillWidth,
                },
              ]}
            />
            {/* Threshold marker */}
            <View
              style={[
                styles.thresholdMarker,
                {
                  left: `${clamp(threshold, 0, 100)}%`,
                  backgroundColor: dark
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'rgba(0, 0, 0, 0.3)',
                },
              ]}
            />
          </View>
        </View>

        {/* Threshold badge row */}
        <View style={styles.thresholdRow}>
          <TouchableOpacity
            onPress={handleThresholdBadgePress}
            style={[
              styles.thresholdBadge,
              {
                backgroundColor: hasCustomThreshold
                  ? (dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.12)')
                  : dark
                    ? 'rgba(100, 116, 139, 0.15)'
                    : 'rgba(148, 163, 184, 0.15)',
                borderColor: hasCustomThreshold
                  ? (dark ? 'rgba(165, 180, 252, 0.35)' : 'rgba(99, 102, 241, 0.25)')
                  : 'transparent',
              },
            ]}
            accessibilityLabel={`Minimum threshold ${threshold}%`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.thresholdBadgeText,
                {
                  color: hasCustomThreshold ? colors.accent : colors.textTertiary,
                },
              ]}
            >
              min {threshold}%
            </Text>
          </TouchableOpacity>

          {hasCustomThreshold ? (
            <TouchableOpacity
              onPress={handleResetThreshold}
              style={styles.resetButton}
              accessibilityLabel="Reset to global threshold"
              accessibilityRole="button"
            >
              <Text style={[styles.resetText, { color: colors.textTertiary }]}>
                reset
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Inline threshold editor */}
        {editing ? (
          <View
            style={[
              styles.editorCard,
              {
                backgroundColor: dark
                  ? '#1e293b'
                  : 'rgba(255, 255, 255, 0.97)',
                borderColor: dark
                  ? '#334155'
                  : '#e2e8f0',
              },
            ]}
          >
            <Text
              style={[styles.editorLabel, { color: colors.textSecondary }]}
            >
              Subject threshold
            </Text>

            <View style={styles.editorInputRow}>
              <TouchableOpacity
                onPress={() => setSliderValue(v => Math.max(SLIDER_MIN, v - 1))}
                style={[styles.editorStepButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                accessibilityLabel="Decrease threshold"
              >
                <Text style={[styles.editorStepText, { color: colors.text }]}>-</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.editorInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.accent }]}
                value={String(sliderValue)}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) setSliderValue(clamp(num, SLIDER_MIN, SLIDER_MAX));
                  else if (text === '') setSliderValue(SLIDER_MIN);
                }}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={[styles.editorPercent, { color: colors.accent }]}>%</Text>

              <TouchableOpacity
                onPress={() => setSliderValue(v => Math.min(SLIDER_MAX, v + 1))}
                style={[styles.editorStepButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                accessibilityLabel="Increase threshold"
              >
                <Text style={[styles.editorStepText, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Custom slider */}
            <View
              style={styles.sliderContainer}
              onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            >
              <View
                style={[
                  styles.sliderTrack,
                  { backgroundColor: trackBgColor },
                ]}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) =>
                  handleSliderGesture(e.nativeEvent.locationX)
                }
                onResponderMove={(e) =>
                  handleSliderGesture(e.nativeEvent.locationX)
                }
              >
                <View
                  style={[
                    styles.sliderFill,
                    {
                      backgroundColor: INDIGO,
                      width: `${((sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100}%`,
                    },
                  ]}
                />
              </View>
              {/* Thumb */}
              {sliderWidth > 0 ? (
                <View
                  style={[
                    styles.sliderThumb,
                    {
                      left:
                        ((sliderValue - SLIDER_MIN) /
                          (SLIDER_MAX - SLIDER_MIN)) *
                          sliderWidth -
                        SLIDER_THUMB_SIZE / 2,
                      backgroundColor: INDIGO,
                    },
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.sliderLabels}>
              <Text
                style={[styles.sliderLabelText, { color: colors.textTertiary }]}
              >
                {SLIDER_MIN}%
              </Text>
              <Text
                style={[styles.sliderLabelText, { color: colors.textTertiary }]}
              >
                {SLIDER_MAX}%
              </Text>
            </View>

            <View style={styles.editorActions}>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setEditing(false);
                }}
                style={[
                  styles.editorButton,
                  {
                    backgroundColor: dark
                      ? 'rgba(100, 116, 139, 0.2)'
                      : 'rgba(148, 163, 184, 0.15)',
                  },
                ]}
                accessibilityLabel="Cancel threshold edit"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.editorButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSliderCommit}
                style={[
                  styles.editorButton,
                  { backgroundColor: INDIGO },
                ]}
                accessibilityLabel={`Set threshold to ${sliderValue}%`}
                accessibilityRole="button"
              >
                <Text style={[styles.editorButtonText, { color: '#ffffff' }]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subjectCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
  },
  statusMessage: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  projectionLabel: {
    fontSize: 12,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 8,
    borderRadius: 1,
    marginLeft: -1,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  thresholdBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  thresholdBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editorCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  editorLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  editorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  editorStepButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorStepText: {
    fontSize: 18,
    fontWeight: '600',
  },
  editorInput: {
    width: 56,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 0,
  },
  editorPercent: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: -6,
  },
  sliderContainer: {
    height: SLIDER_TRACK_HEIGHT,
    marginTop: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    top: (SLIDER_TRACK_HEIGHT - SLIDER_THUMB_SIZE) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabelText: {
    fontSize: 11,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  editorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editorButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
