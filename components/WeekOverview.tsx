import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject, Timetable } from '../lib/types';
import {
  calculateStatus,
  getEffectiveThreshold,
  getStatusHexColor,
  getSubjectKey,
} from '../lib/utils';

interface WeekOverviewProps {
  timetable: Timetable;
  subjects: Subject[];
  globalThreshold: number;
  subjectThresholds: Record<string, number>;
}


const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// JS getDay() returns 0=Sun..6=Sat; our timetable uses 0=Mon..5=Sat
function getTodayIndex(): number {
  const jsDay = new Date().getDay();
  // Convert: Sun(0)->-1 (no match), Mon(1)->0, Tue(2)->1 ... Sat(6)->5
  return jsDay === 0 ? -1 : jsDay - 1;
}

export default function WeekOverview({
  timetable,
  subjects,
  globalThreshold,
  subjectThresholds,
}: WeekOverviewProps) {
  const { dark, colors } = useThemeContext();

  const todayIndex = getTodayIndex();

  // Build a lookup map: subject code/name -> Subject
  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach((s) => {
      map[getSubjectKey(s)] = s;
    });
    return map;
  }, [subjects]);

  // For each day (0-5), compute the list of dot colors
  const dayDots = useMemo(() => {
    return DAY_NAMES.map((_, dayIdx) => {
      const codes = timetable[dayIdx] ?? [];
      if (codes.length === 0) {
        return [{ color: dark ? '#cbd5e1' : '#94a3b8' }]; // single gray dot for empty day
      }
      return codes.map((code) => {
        const subject = subjectMap[code];
        if (!subject) {
          return { color: dark ? '#cbd5e1' : '#94a3b8' }; // unknown subject, gray
        }
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
        return { color: getStatusHexColor(status, dark) };
      });
    });
  }, [timetable, subjectMap, globalThreshold, subjectThresholds, dark]);

  const cardBase = {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  };

  return (
    <View style={[styles.card, cardBase]}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>
        WEEK AT A GLANCE
      </Text>

      <View style={styles.daysRow}>
        {DAY_NAMES.map((dayName, dayIdx) => {
          const isToday = dayIdx === todayIndex;
          return (
            <View key={dayName} style={styles.dayColumn}>
              <View
                style={[
                  styles.dayColumnInner,
                  isToday && styles.todayColumn,
                  isToday && {
                    borderColor: dark ? 'rgba(165, 180, 252, 0.35)' : 'rgba(99, 102, 241, 0.3)',
                    backgroundColor: dark ? 'rgba(165, 180, 252, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: isToday ? colors.accent : colors.textTertiary },
                    isToday && styles.dayNameToday,
                  ]}
                >
                  {dayName}
                </Text>

                <View style={styles.dotsGrid}>
                  {dayDots[dayIdx].map((dot, dotIdx) => (
                    <View
                      key={dotIdx}
                      style={[styles.dot, { backgroundColor: dot.color }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayColumnInner: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    width: '100%',
  },
  todayColumn: {
    borderWidth: 1,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  dayNameToday: {
    fontWeight: '700',
  },
  dotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
