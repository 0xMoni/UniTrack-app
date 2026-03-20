import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject, Timetable } from '../lib/types';
import {
  calculateStatus,
  getEffectiveThreshold,
  getStatusHexColor,
  getStatusBgRgba,
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
  return jsDay === 0 ? -1 : jsDay - 1;
}

interface DayDetail {
  code: string;
  name: string;
  percentage: number;
  status: 'safe' | 'critical' | 'low' | 'no_data';
  color: string;
}

export default function WeekOverview({
  timetable,
  subjects,
  globalThreshold,
  subjectThresholds,
}: WeekOverviewProps) {
  const { dark, colors } = useThemeContext();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const todayIndex = getTodayIndex();

  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach((s) => {
      map[getSubjectKey(s)] = s;
    });
    return map;
  }, [subjects]);

  // For each day, compute dot colors + detail info
  const dayData = useMemo(() => {
    return DAY_NAMES.map((_, dayIdx) => {
      const codes = timetable[dayIdx] ?? [];
      if (codes.length === 0) {
        return {
          dots: [{ color: dark ? '#cbd5e1' : '#94a3b8' }],
          details: [] as DayDetail[],
        };
      }
      const dots: { color: string }[] = [];
      const details: DayDetail[] = [];
      for (const code of codes) {
        const subject = subjectMap[code];
        if (!subject) {
          dots.push({ color: dark ? '#cbd5e1' : '#94a3b8' });
          continue;
        }
        const threshold = getEffectiveThreshold(subject, globalThreshold, subjectThresholds);
        const status = calculateStatus(subject.percentage, threshold, subject.total);
        const color = getStatusHexColor(status, dark);
        dots.push({ color });
        details.push({
          code,
          name: subject.name,
          percentage: subject.percentage,
          status,
          color,
        });
      }
      return { dots, details };
    });
  }, [timetable, subjectMap, globalThreshold, subjectThresholds, dark]);

  const handleDayPress = (dayIdx: number) => {
    setExpandedDay(expandedDay === dayIdx ? null : dayIdx);
  };

  const cardBase = {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  };

  const expanded = expandedDay !== null ? dayData[expandedDay] : null;

  return (
    <View style={[styles.card, cardBase]}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>
        WEEK AT A GLANCE
      </Text>

      <View style={styles.daysRow}>
        {DAY_NAMES.map((dayName, dayIdx) => {
          const isToday = dayIdx === todayIndex;
          const isExpanded = dayIdx === expandedDay;
          return (
            <TouchableOpacity
              key={dayName}
              onPress={() => handleDayPress(dayIdx)}
              activeOpacity={0.7}
              style={styles.dayColumn}
              accessibilityLabel={`${dayName}, ${dayData[dayIdx].details.length} classes`}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.dayColumnInner,
                  isToday && {
                    borderColor: dark ? 'rgba(165, 180, 252, 0.35)' : 'rgba(99, 102, 241, 0.3)',
                    backgroundColor: dark ? 'rgba(165, 180, 252, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                  },
                  isExpanded && !isToday && {
                    borderColor: dark ? 'rgba(203, 213, 225, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    backgroundColor: dark ? 'rgba(203, 213, 225, 0.05)' : 'rgba(148, 163, 184, 0.05)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: isToday ? colors.accent : isExpanded ? colors.text : colors.textTertiary },
                    (isToday || isExpanded) && styles.dayNameBold,
                  ]}
                >
                  {dayName}
                </Text>

                <View style={styles.dotsGrid}>
                  {dayData[dayIdx].dots.map((dot, dotIdx) => (
                    <View
                      key={dotIdx}
                      style={[styles.dot, { backgroundColor: dot.color }]}
                    />
                  ))}
                </View>

              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Expanded day details */}
      {expanded && expanded.details.length > 0 && (
        <View style={[styles.detailsContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.detailsHeader, { color: colors.textSecondary }]}>
            {DAY_NAMES[expandedDay!]} — {expanded.details.length} {expanded.details.length === 1 ? 'class' : 'classes'}
          </Text>
          {expanded.details.map((detail, idx) => (
            <View
              key={`${detail.code}-${idx}`}
              style={[
                styles.detailRow,
                { backgroundColor: getStatusBgRgba(detail.status, 0.08, dark) },
              ]}
            >
              <View style={[styles.detailDot, { backgroundColor: detail.color }]} />
              <Text style={[styles.detailName, { color: colors.text }]} numberOfLines={1}>
                {detail.name}
              </Text>
              <Text style={[styles.detailPct, { color: detail.color }]}>
                {detail.percentage.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {expanded && expanded.details.length === 0 && expandedDay !== null && (
        <View style={[styles.detailsContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.emptyDay, { color: colors.textTertiary }]}>
            No classes on {DAY_NAMES[expandedDay]}
          </Text>
        </View>
      )}
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
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  dayNameBold: {
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
  /* Expanded details */
  detailsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 6,
  },
  detailsHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailName: {
    fontSize: 13,
    flex: 1,
  },
  detailPct: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  emptyDay: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
