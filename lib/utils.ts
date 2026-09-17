import { Subject, Timetable } from './types';

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

// Normalizes a timetable coming from storage or the AI scanner: keeps days 0-5,
// drops blank/unknown codes, and collapses duplicates so a subject is counted
// once per day (the scanner can emit the same code for every time slot).
export function sanitizeTimetable(
  raw: Timetable | null | undefined,
  subjects?: Subject[]
): Timetable {
  // Maps lowercased code/name -> the canonical key used everywhere else
  const canonical = new Map<string, string>();
  for (const subject of subjects ?? []) {
    const key = getSubjectKey(subject);
    if (!key) continue;
    canonical.set(key.trim().toLowerCase(), key);
    if (subject.code) canonical.set(subject.code.trim().toLowerCase(), key);
    if (subject.name) canonical.set(subject.name.trim().toLowerCase(), key);
  }

  const clean: Timetable = {};
  for (let day = 0; day <= 5; day++) {
    const codes = raw?.[day];
    if (!Array.isArray(codes)) {
      clean[day] = [];
      continue;
    }
    const seen = new Set<string>();
    const dayCodes: string[] = [];
    for (const entry of codes) {
      if (typeof entry !== 'string') continue;
      const trimmed = entry.trim();
      if (!trimmed) continue;
      // Without a subject list (e.g. before attendance loads) keep codes as-is
      const key = canonical.size > 0 ? canonical.get(trimmed.toLowerCase()) : trimmed;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      dayCodes.push(key);
    }
    clean[day] = dayCodes;
  }
  return clean;
}
