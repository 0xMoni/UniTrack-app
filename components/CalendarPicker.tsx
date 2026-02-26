import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';

interface CalendarPickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onSelectDate: (start: Date | null, end: Date | null) => void;
  holidays: Set<string>;
  onToggleHoliday: (dateStr: string) => void;
  minDate: Date;
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export default function CalendarPicker({
  startDate,
  endDate,
  onSelectDate,
  holidays,
  onToggleHoliday,
  minDate,
}: CalendarPickerProps) {
  const { dark, colors } = useThemeContext();
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const tapCount = useMemo(() => {
    if (!startDate) return 0;
    if (!endDate) return 1;
    return 2;
  }, [startDate, endDate]);

  const daysInMonth = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun

    const cells: (Date | null)[] = [];
    // Fill leading blanks
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Fill actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [viewMonth]);

  const monthLabel = useMemo(() => {
    const d = new Date(viewMonth.year, viewMonth.month, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewMonth]);

  function goMonth(delta: number) {
    setViewMonth(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  function handleTapDate(date: Date) {
    if (tapCount === 0 || tapCount === 2) {
      // First tap or reset: set start
      onSelectDate(date, null);
    } else {
      // Second tap: set end
      let s = startDate!;
      let e = date;
      if (e < s) { const tmp = s; s = e; e = tmp; }
      onSelectDate(s, e);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#1e293b' : '#f8fafc', borderColor: colors.cardBorder }]}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => goMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => goMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEKDAY_HEADERS.map((h, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.weekdayText, { color: colors.textTertiary }]}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {daysInMonth.map((date, i) => {
          if (!date) {
            return <View key={`blank-${i}`} style={styles.cell} />;
          }

          const isSun = date.getDay() === 0;
          const isPast = date < minDate;
          const disabled = isSun || isPast;

          const dateStr = formatDateStr(date);
          const isHoliday = holidays.has(dateStr);
          const isStart = startDate && isSameDay(date, startDate);
          const isEnd = endDate && isSameDay(date, endDate);
          const inRange = isInRange(date, startDate, endDate);
          const isToday = isSameDay(date, today);

          let bgColor = 'transparent';
          let textColor = colors.text;

          if (disabled) {
            textColor = colors.textTertiary;
          }

          if (inRange && !isStart && !isEnd) {
            bgColor = dark ? 'rgba(165, 180, 252, 0.12)' : 'rgba(99, 102, 241, 0.08)';
          }

          if (isStart || isEnd) {
            bgColor = colors.accent;
            textColor = '#ffffff';
          }

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.cell, { backgroundColor: bgColor, borderRadius: 8 }]}
              onPress={() => !disabled && handleTapDate(date)}
              disabled={disabled}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.dayText,
                { color: textColor },
                isToday && !isStart && !isEnd && { fontWeight: '700' },
                disabled && { opacity: 0.4 },
              ]}>
                {date.getDate()}
              </Text>
              {isHoliday && (
                <View style={[styles.holidayDot, { backgroundColor: dark ? '#fbbf24' : '#f59e0b' }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  holidayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
