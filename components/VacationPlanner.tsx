import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { Subject, Timetable } from '../lib/types';
import {
  getVacationDays,
  calculateVacationImpact,
  findBestVacationWindows,
  VacationWindow,
} from '../lib/vacationPlanner';
import CalendarPicker from './CalendarPicker';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VacationPlannerProps {
  timetable: Timetable;
  subjectMap: Map<string, Subject>;
  globalThreshold: number;
  subjectThresholds: Record<string, number>;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function VacationPlanner({
  timetable,
  subjectMap,
  globalThreshold,
  subjectThresholds,
}: VacationPlannerProps) {
  const { dark, colors } = useThemeContext();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [showCalendar, setShowCalendar] = useState(false);
  const [suggestions, setSuggestions] = useState<VacationWindow[] | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const handleSelectDate = useCallback((s: Date | null, e: Date | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStartDate(s);
    setEndDate(e);
    setHolidays(new Set());
    setSuggestions(null);
    setShowSuggestions(false);
  }, []);

  const handleToggleHoliday = useCallback((dateStr: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHolidays(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }, []);

  const toggleCalendar = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalendar(prev => !prev);
  }, []);

  // Get vacation days for selected range
  const vacationDays = useMemo(() => {
    if (!startDate || !endDate) return [];
    return getVacationDays(startDate, endDate, holidays);
  }, [startDate, endDate, holidays]);

  // Get weekdays in range (for holiday toggle list)
  const weekdaysInRange = useMemo(() => {
    return vacationDays.filter(d => !d.isSunday);
  }, [vacationDays]);

  // Calculate impact
  const impactResult = useMemo(() => {
    if (vacationDays.length === 0) return null;
    return calculateVacationImpact(
      vacationDays, timetable, subjectMap, globalThreshold, subjectThresholds,
    );
  }, [vacationDays, timetable, subjectMap, globalThreshold, subjectThresholds]);

  const atRiskCount = impactResult
    ? impactResult.impacts.filter(i => i.breachesThreshold && !i.isNoData).length
    : 0;

  const handleFindBest = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const windows = findBestVacationWindows(
      timetable, subjectMap, globalThreshold, subjectThresholds,
    );
    setSuggestions(windows);
    setShowSuggestions(true);
  }, [timetable, subjectMap, globalThreshold, subjectThresholds]);

  const handleApplySuggestion = useCallback((w: VacationWindow) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStartDate(w.startDate);
    setEndDate(w.endDate);
    setHolidays(new Set());
    setShowCalendar(false);
    setShowSuggestions(false);
    setSuggestions(null);
  }, []);

  const cardBase = {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  };

  return (
    <View style={[styles.card, cardBase]}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>
        VACATION PLANNER
      </Text>

      {/* Date range row */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[styles.dateBox, {
            backgroundColor: dark ? '#1e293b' : '#f8fafc',
            borderColor: startDate ? colors.accent : colors.cardBorder,
          }]}
          onPress={toggleCalendar}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.accent} />
          <Text style={[styles.dateText, { color: startDate ? colors.text : colors.textTertiary }]}>
            {startDate ? formatShortDate(startDate) : 'Start'}
          </Text>
        </TouchableOpacity>

        <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} />

        <TouchableOpacity
          style={[styles.dateBox, {
            backgroundColor: dark ? '#1e293b' : '#f8fafc',
            borderColor: endDate ? colors.accent : colors.cardBorder,
          }]}
          onPress={toggleCalendar}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.accent} />
          <Text style={[styles.dateText, { color: endDate ? colors.text : colors.textTertiary }]}>
            {endDate ? formatShortDate(endDate) : 'End'}
          </Text>
        </TouchableOpacity>

        {(startDate || endDate) && (
          <TouchableOpacity
            onPress={() => handleSelectDate(null, null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Calendar */}
      {showCalendar && (
        <View style={styles.calendarWrapper}>
          <CalendarPicker
            startDate={startDate}
            endDate={endDate}
            onSelectDate={handleSelectDate}
            holidays={holidays}
            onToggleHoliday={handleToggleHoliday}
            minDate={today}
          />
        </View>
      )}

      {/* Holiday markers */}
      {startDate && endDate && weekdaysInRange.length > 0 && (
        <View style={styles.holidaySection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Mark holidays
          </Text>
          <View style={styles.holidayList}>
            {weekdaysInRange.map(day => {
              const isHoliday = holidays.has(day.dateStr);
              return (
                <View key={day.dateStr} style={styles.holidayRow}>
                  <Text style={[styles.holidayDate, { color: colors.text }]}>
                    {DAY_NAMES_SHORT[day.jsDay]} {day.date.getDate()}
                  </Text>
                  <Switch
                    value={isHoliday}
                    onValueChange={() => handleToggleHoliday(day.dateStr)}
                    trackColor={{
                      false: dark ? '#475569' : '#cbd5e1',
                      true: dark ? 'rgba(165, 180, 252, 0.5)' : 'rgba(99, 102, 241, 0.4)',
                    }}
                    thumbColor={isHoliday ? colors.accent : (dark ? '#94a3b8' : '#f1f5f9')}
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Impact section */}
      {impactResult && impactResult.totalClasses > 0 ? (
        <View style={styles.impactSection}>
          <View style={styles.impactHeader}>
            <Text style={[styles.impactTitle, { color: colors.text }]}>
              {formatShortDate(startDate!)} — {formatShortDate(endDate!)}
            </Text>
            <Text style={[styles.impactSubtitle, { color: colors.textSecondary }]}>
              {impactResult.totalClasses} {impactResult.totalClasses === 1 ? 'class' : 'classes'} across {impactResult.activeDays} {impactResult.activeDays === 1 ? 'day' : 'days'}
              {holidays.size > 0 ? ` (${holidays.size} holiday${holidays.size > 1 ? 's' : ''} excluded)` : ''}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {impactResult.impacts.map((impact, idx) => {
            const breachColor = dark ? '#f87171' : '#ef4444';
            const dropColor = impact.breachesThreshold
              ? breachColor
              : dark ? '#fbbf24' : '#f59e0b';
            const noDataColor = dark ? '#cbd5e1' : '#94a3b8';

            return (
              <View key={impact.code}>
                <View style={styles.impactRow}>
                  <View style={styles.impactLeft}>
                    <View style={styles.impactNameRow}>
                      <Text
                        style={[styles.impactName, { color: impact.isNoData ? noDataColor : colors.text }]}
                        numberOfLines={1}
                      >
                        {impact.name}
                      </Text>
                      {impact.breachesThreshold && (
                        <View style={[styles.warningBadge, { backgroundColor: dark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
                          <Ionicons name="warning" size={10} color={breachColor} />
                          <Text style={[styles.warningText, { color: breachColor }]}>At risk</Text>
                        </View>
                      )}
                    </View>
                    {!impact.isNoData && (
                      <Text style={[styles.impactClasses, { color: colors.textTertiary }]}>
                        {impact.classCount} {impact.classCount === 1 ? 'class' : 'classes'} missed
                        {impact.currentBunkable !== impact.projectedBunkable
                          ? ` · bunkable: ${impact.currentBunkable} → ${impact.projectedBunkable}`
                          : ''}
                      </Text>
                    )}
                  </View>
                  {!impact.isNoData ? (
                    <View style={styles.impactRight}>
                      <Text style={[styles.impactPct, { color: colors.textSecondary }]}>
                        {parseFloat(impact.currentPct.toFixed(1))}%
                      </Text>
                      <Text style={[styles.impactArrow, { color: colors.textTertiary }]}> → </Text>
                      <Text style={[styles.impactPct, { color: dropColor }]}>
                        {parseFloat(impact.projectedPct.toFixed(1))}%
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.impactPct, { color: noDataColor }]}>No data</Text>
                  )}
                </View>
                {idx < impactResult.impacts.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                )}
              </View>
            );
          })}

          {/* Summary footer */}
          <View
            style={[
              styles.summaryFooter,
              {
                backgroundColor: atRiskCount > 0
                  ? (dark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.06)')
                  : (dark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.06)'),
              },
            ]}
          >
            <Text
              style={[
                styles.summaryText,
                {
                  color: atRiskCount > 0
                    ? (dark ? '#f87171' : '#ef4444')
                    : (dark ? '#34d399' : '#10b981'),
                },
              ]}
            >
              {atRiskCount > 0
                ? `${atRiskCount} ${atRiskCount === 1 ? 'subject' : 'subjects'} at risk`
                : 'All subjects stay safe'}
            </Text>
          </View>
        </View>
      ) : impactResult && impactResult.totalClasses === 0 && startDate && endDate ? (
        <View style={styles.hintContainer}>
          <Text style={[styles.hintSub, { color: colors.textTertiary }]}>
            No classes in this range{holidays.size > 0 ? ' (after excluding holidays)' : ''}
          </Text>
        </View>
      ) : !startDate ? (
        <View style={styles.hintContainer}>
          <Text style={[styles.hintSub, { color: colors.textTertiary }]}>
            Select a date range to see attendance impact
          </Text>
        </View>
      ) : null}

      {/* Smart suggestions */}
      <View style={[styles.divider, { backgroundColor: colors.divider, marginTop: 14 }]} />

      <TouchableOpacity
        style={[styles.suggestButton, {
          backgroundColor: dark ? 'rgba(165, 180, 252, 0.12)' : 'rgba(99, 102, 241, 0.08)',
        }]}
        onPress={handleFindBest}
        activeOpacity={0.7}
      >
        <Ionicons name="sparkles" size={14} color={colors.accent} />
        <Text style={[styles.suggestButtonText, { color: colors.accent }]}>
          Find best vacation windows
        </Text>
      </TouchableOpacity>

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((w, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.suggestionCard, {
                backgroundColor: dark ? '#1e293b' : '#f8fafc',
                borderColor: colors.cardBorder,
              }]}
              onPress={() => handleApplySuggestion(w)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionTop}>
                <Text style={[styles.suggestionDates, { color: colors.text }]}>
                  {formatShortDate(w.startDate)} — {formatShortDate(w.endDate)}
                </Text>
                <View style={[styles.durationBadge, {
                  backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                }]}>
                  <Text style={[styles.durationText, { color: colors.accent }]}>
                    {w.duration}d
                  </Text>
                </View>
              </View>
              <View style={styles.suggestionBottom}>
                <Text style={[styles.suggestionMeta, { color: colors.textSecondary }]}>
                  {w.totalClasses} {w.totalClasses === 1 ? 'class' : 'classes'} missed
                </Text>
                <Text style={[styles.suggestionRisk, {
                  color: w.atRiskCount > 0
                    ? (dark ? '#f87171' : '#ef4444')
                    : (dark ? '#34d399' : '#10b981'),
                }]}>
                  {w.atRiskCount > 0
                    ? `${w.atRiskCount} at risk`
                    : 'All safe'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showSuggestions && suggestions && suggestions.length === 0 && (
        <View style={styles.hintContainer}>
          <Text style={[styles.hintSub, { color: colors.textTertiary }]}>
            No vacation windows found in the next 3 weeks
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarWrapper: {
    marginTop: 12,
  },
  holidaySection: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  holidayList: {
    gap: 2,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  holidayDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  impactSection: {
    marginTop: 16,
  },
  impactHeader: {
    marginBottom: 10,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  impactSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 8,
  },
  impactLeft: {
    flex: 1,
    gap: 2,
  },
  impactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  impactName: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  impactClasses: {
    fontSize: 11,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 10,
    fontWeight: '600',
  },
  impactRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactPct: {
    fontSize: 13,
    fontWeight: '600',
  },
  impactArrow: {
    fontSize: 12,
  },
  summaryFooter: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  hintContainer: {
    marginTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  hintSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  suggestButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  suggestionCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  suggestionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionDates: {
    fontSize: 13,
    fontWeight: '600',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  suggestionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionMeta: {
    fontSize: 12,
  },
  suggestionRisk: {
    fontSize: 12,
    fontWeight: '600',
  },
});
