import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import StudentInfoCard from './StudentInfoCard';
import OverallStatsCard from './OverallStatsCard';
import StatusFilter from './StatusFilter';
import AttendanceCard from './AttendanceCard';
import TodayCard from './TodayCard';
import WeekOverview from './WeekOverview';
import PremiumGate from './PremiumGate';
import { AttendanceData, StatusFilter as StatusFilterType, Timetable, Subject } from '../lib/types';
import { calculateStatus, getSubjectKey, getEffectiveThreshold } from '../lib/utils';
import { PremiumStatus } from '../lib/usePremium';

interface DashboardScreenProps {
  attendanceData: AttendanceData;
  threshold: number;
  subjectThresholds: Record<string, number>;
  activeFilter: StatusFilterType;
  onFilterChange: (filter: StatusFilterType) => void;
  timetable: Timetable;
  premiumStatus: PremiumStatus;
  isAutoRefreshing: boolean;
  onThresholdModalOpen: () => void;
  onTimetableSetupOpen: () => void;
  onUpgradeModalOpen: () => void;
  onSubjectThresholdChange: (subjectKey: string, value: number | null) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export default function DashboardScreen({
  attendanceData,
  threshold,
  subjectThresholds,
  activeFilter,
  onFilterChange,
  timetable,
  premiumStatus,
  isAutoRefreshing,
  onThresholdModalOpen,
  onTimetableSetupOpen,
  onUpgradeModalOpen,
  onSubjectThresholdChange,
  onRefresh,
  isRefreshing,
}: DashboardScreenProps) {
  const { dark, colors } = useThemeContext();

  const getSubjectStatus = (subject: Subject) => {
    const t = getEffectiveThreshold(subject, threshold, subjectThresholds);
    return calculateStatus(subject.percentage, t, subject.total);
  };

  const statusCounts = attendanceData.subjects.reduce(
    (acc, subject) => {
      const status = getSubjectStatus(subject);
      acc[status]++;
      return acc;
    },
    { safe: 0, critical: 0, low: 0, no_data: 0 }
  );

  const filteredSubjects = activeFilter === 'all'
    ? attendanceData.subjects
    : attendanceData.subjects.filter(s => getSubjectStatus(s) === activeFilter);

  const customCount = Object.keys(subjectThresholds).length;

  // Timetable
  const hasTimetable = Object.values(timetable).some(codes => codes.length > 0);
  const subjectMap = useMemo(() => new Map(attendanceData.subjects.map(s => [getSubjectKey(s), s])), [attendanceData.subjects]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={dark ? '#a5b4fc' : '#6366f1'}
          colors={['#6366f1']}
          progressBackgroundColor={dark ? '#1e293b' : '#ffffff'}
        />
      }
    >
      {/* Student Info */}
      <StudentInfoCard
        student={attendanceData.student}
        lastUpdated={attendanceData.lastUpdated}
      />

      {/* Auto-refresh indicator */}
      {isAutoRefreshing && (
        <View style={[styles.autoRefreshBanner, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)', borderColor: dark ? 'rgba(165, 180, 252, 0.25)' : 'rgba(99, 102, 241, 0.2)' }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.autoRefreshText, { color: colors.accent }]}>Updating attendance data...</Text>
        </View>
      )}

      {/* Today's Classes / Timetable Setup prompt */}
      {hasTimetable ? (
        <PremiumGate isPremium={premiumStatus.isPaidPremium} onUpgradePress={onUpgradeModalOpen}>
          <TodayCard
            timetable={timetable}
            subjectMap={subjectMap}
            globalThreshold={threshold}
            subjectThresholds={subjectThresholds}
          />
          <View style={{ marginTop: 12 }}>
            <WeekOverview
              timetable={timetable}
              subjects={attendanceData.subjects}
              globalThreshold={threshold}
              subjectThresholds={subjectThresholds}
            />
          </View>
        </PremiumGate>
      ) : (
        <TouchableOpacity
          onPress={() => premiumStatus.isPaidPremium ? onTimetableSetupOpen() : onUpgradeModalOpen()}
          style={[styles.timetablePrompt, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          activeOpacity={0.7}
        >
          <View style={[styles.timetableIconBox, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.timetableTitle, { color: colors.text }]}>Set up your timetable</Text>
            <Text style={[styles.timetableSub, { color: colors.textTertiary }]}>See which classes you can skip today</Text>
          </View>
          {!premiumStatus.isPaidPremium && (
            <View style={styles.proBadge}>
              <Ionicons name="lock-closed" size={10} color="#ffffff" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Overall Stats */}
      <OverallStatsCard
        subjects={attendanceData.subjects}
        globalThreshold={threshold}
        subjectThresholds={subjectThresholds}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />

      {/* Threshold indicator */}
      <View style={styles.thresholdRow}>
        <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>Default threshold:</Text>
        <Text style={[styles.thresholdValue, { color: colors.text }]}>{threshold}%</Text>
        <TouchableOpacity onPress={onThresholdModalOpen}>
          <Text style={[styles.thresholdChange, { color: colors.accent }]}>Change</Text>
        </TouchableOpacity>
        {customCount > 0 && (
          <View style={[styles.customBadge, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
            <Text style={[styles.customBadgeText, { color: colors.accent }]}>{customCount} custom</Text>
          </View>
        )}
      </View>

      {/* Status Filter */}
      <StatusFilter
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        counts={statusCounts}
      />

      {/* Attendance Cards */}
      {filteredSubjects.length > 0 ? (
        filteredSubjects.map((subject, index) => {
          const key = getSubjectKey(subject);
          const effectiveThreshold = getEffectiveThreshold(subject, threshold, subjectThresholds);
          return (
            <AttendanceCard
              key={`${key}-${index}`}
              subject={subject}
              threshold={effectiveThreshold}
              hasCustomThreshold={key in subjectThresholds}
              onThresholdChange={(value) => onSubjectThresholdChange(key, value)}
              isPremium={premiumStatus.isPaidPremium}
              onUpgradePress={onUpgradeModalOpen}
            />
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color={colors.textTertiary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No subjects match the selected filter
          </Text>
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  autoRefreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  autoRefreshText: {
    fontSize: 13,
  },
  timetablePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  timetableIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timetableTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  timetableSub: {
    fontSize: 12,
    marginTop: 2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thresholdLabel: {
    fontSize: 13,
  },
  thresholdValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  thresholdChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 16,
  },
});
