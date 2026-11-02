import { addDays, format, parseISO } from 'date-fns';
import { MetaAdsReportDay } from '@/types/meta-ads';

export type RangeKind = 'month' | '30d' | '90d' | '12m';

export const RANGE_OPTIONS: { value: RangeKind; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
];

// Malaysia date, matching how the server buckets orders and ad days.
export function todayInMalaysia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
}

export function rangeFor(kind: RangeKind, month: string, today: string) {
  if (kind === 'month') {
    const [y, m] = month.split('-').map(Number);
    const last = format(new Date(y, m, 0), 'yyyy-MM-dd');
    return { from: `${month}-01`, to: last < today ? last : today };
  }
  if (kind === '12m') {
    const t = parseISO(today);
    const from = format(new Date(t.getFullYear(), t.getMonth() - 11, 1), 'yyyy-MM-dd');
    return { from, to: today };
  }
  const days = kind === '30d' ? 30 : 90;
  return { from: format(addDays(parseISO(today), -(days - 1)), 'yyyy-MM-dd'), to: today };
}

export function rangeLabel(kind: RangeKind, from: string, to: string) {
  if (kind === 'month') return format(parseISO(from), 'MMMM yyyy');
  const a = parseISO(from);
  const b = parseISO(to);
  const sameYear = a.getFullYear() === b.getFullYear();
  return `${format(a, sameYear ? 'd MMM' : 'd MMM yyyy')} – ${format(b, 'd MMM yyyy')}`;
}

export type Bucket = Omit<MetaAdsReportDay, 'date'> & { key: string; label: string; short: string };

// Days for a month or 30/90 days; whole months for a year.
export function bucketDays(days: MetaAdsReportDay[], byMonth: boolean): Bucket[] {
  if (!byMonth) {
    return days.map((d) => ({
      ...d,
      key: d.date,
      label: format(parseISO(d.date), 'EEE d MMM'),
      short: format(parseISO(d.date), 'd MMM'),
    }));
  }
  const map = new Map<string, Bucket>();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    const b =
      map.get(key) ??
      ({
        key,
        label: format(parseISO(`${key}-01`), 'MMMM yyyy'),
        short: format(parseISO(`${key}-01`), 'MMM yy'),
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversations: 0,
        orders: 0,
        revenue: 0,
        chat_orders: 0,
        chat_revenue: 0,
        new_customers: 0,
      } as Bucket);
    b.spend += d.spend;
    b.impressions += d.impressions;
    b.clicks += d.clicks;
    b.conversations += d.conversations;
    b.orders += d.orders;
    b.revenue += d.revenue;
    b.chat_orders += d.chat_orders;
    b.chat_revenue += d.chat_revenue;
    b.new_customers += d.new_customers;
    map.set(key, b);
  }
  return [...map.values()];
}

export const ratio = (top: number, bottom: number) => (bottom ? top / bottom : null);
export const times = (n: number | null) => (n == null ? '—' : `${n.toFixed(2)}×`);
