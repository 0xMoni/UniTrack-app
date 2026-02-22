import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject } from '../lib/types';
import {
  calculateClassesToBunk,
  calculateStatus,
  getEffectiveThreshold,
  getSubjectKey,
  getStatusHexColor,
} from '../lib/utils';

interface TodayCardProps {
  subjects: Subject[];
  globalThreshold: number;
  subjectThresholds: Record<string, number>;
}


const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

type Verdict = 'skip' | 'risky' | 'attend' | 'no_data';

interface VerdictStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
}

const VERDICT_STYLES_LIGHT: Record<Verdict, VerdictStyle> = {
  skip: {
    label: 'Can skip',
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#10b981',
    border: 'rgba(16, 185, 129, 0.2)',
  },
  risky: {
    label: 'Risky',
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.2)',
  },
  attend: {
    label: 'Must attend',
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.2)',
  },
  no_data: {
    label: 'No data',
    bg: 'rgba(148, 163, 184, 0.1)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.2)',
  },
};

const VERDICT_STYLES_DARK: Record<Verdict, VerdictStyle> = {
  skip: {
    label: 'Can skip',
    bg: 'rgba(52, 211, 153, 0.15)',
    text: '#34d399',
    border: 'rgba(52, 211, 153, 0.3)',
  },
  risky: {
    label: 'Risky',
    bg: 'rgba(251, 191, 36, 0.15)',
    text: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  attend: {
    label: 'Must attend',
    bg: 'rgba(248, 113, 113, 0.15)',
    text: '#f87171',
    border: 'rgba(248, 113, 113, 0.3)',
  },
  no_data: {
    label: 'No data',
    bg: 'rgba(203, 213, 225, 0.15)',
    text: '#cbd5e1',
    border: 'rgba(203, 213, 225, 0.3)',
  },
};

function getVerdict(subject: Subject, threshold: number): Verdict {
  const status = calculateStatus(subject.percentage, threshold, subject.total);

  if (status === 'no_data') return 'no_data';

  if (status === 'safe') {
    const classesToBunk = calculateClassesToBunk(
      subject.attended,
      subject.total,
      threshold
    );
    if (classesToBunk > 0) return 'skip';
  }

  if (status === 'low') return 'attend';

  return 'risky';
}

export default function TodayCard({
  subjects,
  globalThreshold,
  subjectThresholds,
}: TodayCardProps) {
  const { dark, colors } = useThemeContext();
  const VERDICT_STYLES = dark ? VERDICT_STYLES_DARK : VERDICT_STYLES_LIGHT;

  const dayName = DAY_NAMES[new Date().getDay()];

  const verdicts = useMemo(() => {
    return subjects.map((subject) => {
      const threshold = getEffectiveThreshold(
        subject,
        globalThreshold,
        subjectThresholds
      );
      const verdict = getVerdict(subject, threshold);
      return { subject, verdict, threshold };
    });
  }, [subjects, globalThreshold, subjectThresholds]);

  const skippableCount = useMemo(() => {
    return verdicts.filter((v) => v.verdict === 'skip').length;
  }, [verdicts]);

  const cardBase = {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  };

  if (subjects.length === 0) {
    return (
      <View style={[styles.card, cardBase]}>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: dark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.1)' }]}>
            <Ionicons name="remove-outline" size={20} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyDayName, { color: colors.text }]}>
            {dayName}
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No classes today — enjoy your free time!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, cardBase]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.calendarIconBg, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="calendar-outline" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Today — {dayName}
          </Text>
        </View>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {subjects.length} {subjects.length === 1 ? 'class' : 'classes'}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* Subject Rows */}
      {verdicts.map((item, index) => {
        const { subject, verdict } = item;
        const threshold = getEffectiveThreshold(
          subject,
          globalThreshold,
          subjectThresholds
        );
        const status = calculateStatus(
          subject.percentage,
          threshold,
          subject.total
        );
        const percentColor = getStatusHexColor(status, dark);
        const vs = VERDICT_STYLES[verdict];

        return (
          <View key={getSubjectKey(subject) + '-' + index}>
            <View style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <Text
                  style={[styles.subjectName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {subject.name}
                </Text>
                {subject.code ? (
                  <Text
                    style={[styles.subjectCode, { color: colors.textTertiary }]}
                  >
                    {subject.code}
                  </Text>
                ) : null}
              </View>

              <View style={styles.subjectRight}>
                <Text style={[styles.percentage, { color: percentColor }]}>
                  {subject.total > 0
                    ? `${Math.round(subject.percentage)}%`
                    : '—'}
                </Text>
                <View
                  style={[
                    styles.verdictBadge,
                    {
                      backgroundColor: vs.bg,
                      borderColor: vs.border,
                    },
                  ]}
                >
                  <Text style={[styles.verdictText, { color: vs.text }]}>
                    {vs.label}
                  </Text>
                </View>
              </View>
            </View>

            {index < verdicts.length - 1 && (
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
            )}
          </View>
        );
      })}

      {/* Summary Footer */}
      <View
        style={[
          styles.summaryFooter,
          {
            backgroundColor: colors.divider,
          },
        ]}
      >
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {skippableCount > 0
            ? `You can safely skip ${skippableCount} of ${subjects.length} ${
                subjects.length === 1 ? 'class' : 'classes'
              } today`
            : 'Better attend all classes today'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyDayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerCount: {
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectCode: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  subjectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'right',
  },
  verdictBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  verdictText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
