/**
 * Date utilities for the goal tracker.
 * All dates are strings in "YYYY-MM-DD" format.
 */

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateStr(str: string): Date {
  if (!str || str.length < 8) return new Date(); // safety fallback
  const [y, m, d] = str.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m - 1, d);
}

/** Check if a date string is valid (non-empty, parseable) */
export function isValidDate(str?: string): str is string {
  return !!str && str.length >= 8 && !isNaN(fromDateStr(str).getTime());
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function getMonthName(month: number): string {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][month];
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getShortMonthName(month: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
}

/** Number of days between two date strings. Positive if end > start. */
export function daysBetween(start: string, end: string): number {
  const s = fromDateStr(start);
  const e = fromDateStr(end);
  return Math.round((e.getTime() - s.getTime()) / 86400000);
}

/** Format time remaining as human-readable string */
export function formatTimeLeft(targetDate: string): { label: string; overdue: boolean } {
  if (!targetDate || targetDate.length < 8) return { label: '-', overdue: false };
  const today = todayStr();
  const days = daysBetween(today, targetDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    if (absDays >= 365) {
      const years = Math.round(absDays / 365 * 10) / 10;
      return { label: `${years}y ago`, overdue: true };
    }
    if (absDays >= 30) {
      const months = Math.round(absDays / 30);
      return { label: `${months}m ago`, overdue: true };
    }
    return { label: `${absDays}d ago`, overdue: true };
  }

  if (days === 0) return { label: 'Today', overdue: false };
  if (days === 1) return { label: '1d left', overdue: false };
  if (days < 7) return { label: `${days}d left`, overdue: false };
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return { label: `${weeks}w left`, overdue: false };
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return { label: `${months}m left`, overdue: false };
  }
  const years = Math.round(days / 365 * 10) / 10;
  return { label: `${years}y left`, overdue: false };
}

/** Format a date string for display (e.g. "1 Jan '25") */
export function formatDateShort(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return '-';
  const d = fromDateStr(dateStr);
  const day = d.getDate();
  const month = getShortMonthName(d.getMonth());
  const year = String(d.getFullYear()).slice(2);
  return `${day} ${month} '${year}`;
}

/** Check if a date is today */
export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

/** Check if a date is in the future */
export function isFuture(dateStr: string): boolean {
  return dateStr > todayStr();
}

/** Check if a date is in the past */
export function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}
