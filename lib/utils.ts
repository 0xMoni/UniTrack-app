import { Subject } from './types';

const BUFFER = 5; // Buffer percentage above threshold

export function calculateStatus(
  percentage: number,
  threshold: number,
  total: number = -1
): 'safe' | 'critical' | 'low' | 'no_data' {
  if (total === 0) return 'no_data';
  if (percentage >= threshold + BUFFER) {
    return 'safe';
  } else if (percentage >= threshold) {
    return 'critical';
  }
  return 'low';
}

// RN color helpers (replacing Tailwind classes)
// Dark mode uses brighter variants for better contrast against dark backgrounds
export function getStatusHexColor(status: 'safe' | 'critical' | 'low' | 'no_data', dark = false): string {
  if (dark) {
    switch (status) {
      case 'safe': return '#34d399';
      case 'critical': return '#fbbf24';
      case 'low': return '#f87171';
      case 'no_data': return '#cbd5e1';
    }
  }
  switch (status) {
    case 'safe': return '#10b981';
    case 'critical': return '#f59e0b';
    case 'low': return '#ef4444';
    case 'no_data': return '#94a3b8';
  }
}

export function getStatusBgRgba(status: 'safe' | 'critical' | 'low' | 'no_data', opacity = 0.1, dark = false): string {
  // In dark mode, boost opacity for better visibility
  const o = dark ? Math.min(opacity * 2.5, 0.3) : opacity;
  switch (status) {
    case 'safe': return `rgba(52, 211, 153, ${o})`;
    case 'critical': return `rgba(251, 191, 36, ${o})`;
    case 'low': return `rgba(248, 113, 113, ${o})`;
    case 'no_data': return `rgba(203, 213, 225, ${o})`;
  }
}

export function getStatusBorderColor(status: 'safe' | 'critical' | 'low' | 'no_data', dark = false): string {
  const opacity = dark ? 0.4 : 0.2;
  switch (status) {
    case 'safe': return `rgba(52, 211, 153, ${opacity})`;
    case 'critical': return `rgba(251, 191, 36, ${opacity})`;
    case 'low': return `rgba(248, 113, 113, ${opacity})`;
    case 'no_data': return `rgba(203, 213, 225, ${opacity})`;
  }
}

export function calculateClassesToBunk(
  attended: number,
  total: number,
  threshold: number
): number {
  const canBunk = Math.floor((attended * 100) / threshold - total);
  return Math.max(0, canBunk);
}

export function calculateClassesToAttend(
  attended: number,
  total: number,
  threshold: number
): number {
  if (threshold >= 100) return Infinity;
  const needed = Math.ceil(
    (total * threshold - attended * 100) / (100 - threshold)
  );
  return Math.max(0, needed);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const STORAGE_KEY = 'unitrack_data';
export const CREDENTIALS_KEY = 'unitrack_credentials';
export const THRESHOLD_KEY = 'unitrack_threshold';
export const SUBJECT_THRESHOLDS_KEY = 'unitrack_subject_thresholds';
export const ERP_URL_KEY = 'unitrack_erp_url';
export const TIMETABLE_KEY = 'unitrack_timetable';

export function getSubjectKey(subject: Subject): string {
  return subject.code || subject.name;
}

export function getEffectiveThreshold(
  subject: Subject,
  globalThreshold: number,
  subjectThresholds: Record<string, number>
): number {
  const key = getSubjectKey(subject);
  return subjectThresholds[key] ?? globalThreshold;
}
