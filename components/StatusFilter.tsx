import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { StatusFilter as StatusFilterType } from '../lib/types';
import { getStatusHexColor } from '../lib/utils';

interface StatusFilterProps {
  activeFilter: StatusFilterType;
  onFilterChange: (filter: StatusFilterType) => void;
  counts: { safe: number; critical: number; low: number; no_data: number };
}

interface FilterOption {
  key: StatusFilterType;
  label: string;
  dotColor: string;
}

export default function StatusFilter({
  activeFilter,
  onFilterChange,
  counts,
}: StatusFilterProps) {
  const { dark, colors } = useThemeContext();

  const totalCount = counts.safe + counts.critical + counts.low + counts.no_data;

  const filters: FilterOption[] = [
    { key: 'all', label: 'All', dotColor: colors.accent },
    { key: 'safe', label: 'Safe', dotColor: getStatusHexColor('safe', dark) },
    { key: 'critical', label: 'Critical', dotColor: getStatusHexColor('critical', dark) },
    { key: 'low', label: 'Low', dotColor: getStatusHexColor('low', dark) },
  ];

  if (counts.no_data > 0) {
    filters.push({
      key: 'no_data',
      label: 'No Data',
      dotColor: getStatusHexColor('no_data', dark),
    });
  }

  const getCount = (key: StatusFilterType): number => {
    if (key === 'all') return totalCount;
    return counts[key];
  };

  const activeBg = dark ? '#ffffff' : '#0f172a';
  const activeText = dark ? '#0f172a' : '#ffffff';
  const inactiveBg = dark ? '#1e293b' : '#f1f5f9';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? activeBg : inactiveBg,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => onFilterChange(filter.key)}
          >
            <View
              style={[styles.dot, { backgroundColor: filter.dotColor }]}
            />
            <Text
              style={[
                styles.chipLabel,
                {
                  color: isActive ? activeText : colors.textSecondary,
                },
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isActive
                    ? dark
                      ? 'rgba(0,0,0,0.15)'
                      : 'rgba(255,255,255,0.2)'
                    : dark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isActive ? activeText : colors.textTertiary,
                  },
                ]}
              >
                {getCount(filter.key)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
