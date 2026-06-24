export const APP_TIMEZONE = 'Asia/Kuala_Lumpur';

export function formatDateUTC8(dateInput: string | Date) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  return date.toLocaleString('en-MY', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // set to true if you want AM/PM
  });
}

export function formatDateToYYYYMMDD(date?: Date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Current calendar month in app timezone as YYYY-MM */
export function getCurrentMonthKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  return `${year}-${month}`;
}

/** Parse YYYY-MM into a Date anchored at day 1 in app timezone */
export function parseMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/** Resolve month query param, defaulting to current month in app timezone */
export function resolveMonthKey(month?: string | null): string {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  return getCurrentMonthKey();
}
