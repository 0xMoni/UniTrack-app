import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject, StatusFilter } from '../lib/types';
import {
  calculateClassesToBunk,
  calculateClassesToAttend,
  calculateStatus,
  getEffectiveThreshold,
  getStatusHexColor,
} from '../lib/utils';

interface OverallStatsCardProps {
  subjects: Subject[];
  globalThreshold: number;
  subjectThresholds: Record<string, number>;
  activeFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
}

export default function OverallStatsCard({
  subjects,
  globalThreshold,
  subjectThresholds,
  activeFilter,
  onFilterChange,
}: OverallStatsCardProps) {
  const { dark, colors } = useThemeContext();

  const stats = useMemo(() => {
    const activeSubjects = subjects.filter((s) => s.total > 0);

    const totalAttended = activeSubjects.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = activeSubjects.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage =
      totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    let totalBunkable = 0;
    let totalNeeded = 0;
    let safeCount = 0;
    let criticalCount = 0;
    let lowCount = 0;

    activeSubjects.forEach((subject) => {
      const threshold = getEffectiveThreshold(subject, globalThreshold, subjectThresholds);
      const status = calculateStatus(subject.percentage, threshold, subject.total);

      if (status === 'safe') safeCount++;
      else if (status === 'critical') criticalCount++;
      else if (status === 'low') lowCount++;

      const bunkable = calculateClassesToBunk(subject.attended, subject.total, threshold);
      const needed = calculateClassesToAttend(subject.attended, subject.total, threshold);

      totalBunkable += bunkable;
      totalNeeded += needed;
    });

    const totalActiveSubjects = activeSubjects.length;

    // Overall projection: assume next full day with totalActiveSubjects classes
    const afterAttendAll =
      totalClasses + totalActiveSubjects > 0
        ? Math.round(
            ((totalAttended + totalActiveSubjects) /
              (totalClasses + totalActiveSubjects)) *
              100
          )
        : 0;
    const afterSkipAll =
      totalClasses + totalActiveSubjects > 0
        ? Math.round(
            (totalAttended / (totalClasses + totalActiveSubjects)) * 100
          )
        : 0;

    const overallStatus = calculateStatus(overallPercentage, globalThreshold);

    return {
      overallPercentage,
      overallStatus,
      totalBunkable,
      totalNeeded,
      safeCount,
      criticalCount,
      lowCount,
      afterAttendAll,
      afterSkipAll,
    };
  }, [subjects, globalThreshold, subjectThresholds]);

  const handlePress = (filter: StatusFilter) => {
    onFilterChange?.(filter);
  };

  const cardBase = {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  };

  const activeCardBorder = dark
    ? 'rgba(255,255,255,0.25)'
    : 'rgba(0,0,0,0.15)';

  return (
    <View style={styles.wrapper}>
      {/* 2x2 Grid */}
      <View style={styles.grid}>
        {/* Overall */}
        <TouchableOpacity
          style={[
            styles.statCard,
            cardBase,
            activeFilter === 'all' && { borderColor: activeCardBorder },
          ]}
          activeOpacity={0.7}
          onPress={() => handlePress('all')}
        >
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            OVERALL
          </Text>
          <Text
            style={[
              styles.value,
              { color: getStatusHexColor(stats.overallStatus, dark) },
            ]}
          >
            {stats.overallPercentage}%
          </Text>
          <Text style={[styles.subText, { color: colors.textTertiary }]}>
            attendance
          </Text>
        </TouchableOpacity>

        {/* Safe */}
        <TouchableOpacity
          style={[
            styles.statCard,
            cardBase,
            activeFilter === 'safe' && { borderColor: activeCardBorder },
          ]}
          activeOpacity={0.7}
          onPress={() => handlePress('safe')}
        >
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            SAFE
          </Text>
          <Text
            style={[styles.value, { color: getStatusHexColor('safe', dark) }]}
          >
            {stats.safeCount}
          </Text>
          <Text style={[styles.subText, { color: colors.textTertiary }]}>
            {stats.safeCount === 1 ? 'subject' : 'subjects'}
          </Text>
        </TouchableOpacity>

        {/* Can Bunk */}
        <TouchableOpacity
          style={[
            styles.statCard,
            cardBase,
            activeFilter === 'safe' && { borderColor: activeCardBorder },
          ]}
          activeOpacity={0.7}
          onPress={() => handlePress('safe')}
        >
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            CAN BUNK
          </Text>
          <Text
            style={[styles.value, { color: getStatusHexColor('safe', dark) }]}
          >
            {stats.totalBunkable}
          </Text>
          <Text style={[styles.subText, { color: colors.textTertiary }]}>
            {stats.totalBunkable === 1 ? 'class' : 'classes'}
          </Text>
        </TouchableOpacity>

        {/* At Risk / Must Attend */}
        <TouchableOpacity
          style={[
            styles.statCard,
            cardBase,
            activeFilter === 'low' && { borderColor: activeCardBorder },
          ]}
          activeOpacity={0.7}
          onPress={() => handlePress('low')}
        >
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            {stats.totalNeeded > 0 ? 'MUST ATTEND' : 'AT RISK'}
          </Text>
          <Text
            style={[
              styles.value,
              {
                color:
                  stats.totalNeeded > 0
                    ? getStatusHexColor('low', dark)
                    : getStatusHexColor('critical', dark),
              },
            ]}
          >
            {stats.totalNeeded > 0
              ? stats.totalNeeded
              : stats.criticalCount + stats.lowCount}
          </Text>
          <Text style={[styles.subText, { color: colors.textTertiary }]}>
            {stats.totalNeeded > 0
              ? stats.totalNeeded === 1
                ? 'class needed'
                : 'classes needed'
              : stats.criticalCount + stats.lowCount === 1
              ? 'subject'
              : 'subjects'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overall Projection */}
      <View style={[styles.projectionCard, cardBase]}>
        <Text style={[styles.projectionLabel, { color: colors.textTertiary }]}>
          NEXT DAY PROJECTION
        </Text>
        <View style={styles.projectionGrid}>
          <View style={styles.projectionItem}>
            <Text style={[styles.projectionItemLabel, { color: colors.textTertiary }]}>Current</Text>
            <Text style={[styles.projectionItemValue, { color: colors.text }]}>{stats.overallPercentage}%</Text>
          </View>
          <View style={styles.projectionDivider}>
            <View style={[styles.projectionDividerLine, { backgroundColor: dark ? '#334155' : '#e2e8f0' }]} />
          </View>
          <View style={styles.projectionItem}>
            <Text style={[styles.projectionItemLabel, { color: dark ? '#34d399' : '#10b981' }]}>Attend all</Text>
            <Text style={[styles.projectionItemValue, { color: dark ? '#34d399' : '#10b981' }]}>{stats.afterAttendAll}%</Text>
          </View>
          <View style={styles.projectionDivider}>
            <View style={[styles.projectionDividerLine, { backgroundColor: dark ? '#334155' : '#e2e8f0' }]} />
          </View>
          <View style={styles.projectionItem}>
            <Text style={[styles.projectionItemLabel, { color: dark ? '#f87171' : '#ef4444' }]}>Skip all</Text>
            <Text style={[styles.projectionItemValue, { color: dark ? '#f87171' : '#ef4444' }]}>{stats.afterSkipAll}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
  },
  projectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  projectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  projectionGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  projectionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  projectionItemLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  projectionItemValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  projectionDivider: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 14,
  },
  projectionDividerLine: {
    width: 1,
    height: 28,
  },
});
