import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { formatDate } from '../lib/utils';

interface StudentInfoCardProps {
  student: { name: string; usn: string };
  lastUpdated: string;
}


function getTodayFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function StudentInfoCard({ student, lastUpdated }: StudentInfoCardProps) {
  const { colors } = useThemeContext();


  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.name, { color: colors.text }]}>
        {student.name}
      </Text>

      <Text style={[styles.usn, { color: colors.textSecondary }]}>
        {student.usn}
      </Text>

      <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
        Last updated: {formatDate(lastUpdated)}
      </Text>

      <Text style={[styles.today, { color: colors.accent }]}>
        {getTodayFormatted()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  usn: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: 8,
  },
  today: {
    fontSize: 12,
    marginTop: 4,
  },
});
