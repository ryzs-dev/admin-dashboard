import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { Bucket, ratio, times } from './period';

// Same pinned header and total row as the dashboard's day-by-day table.
const TH =
  'sticky top-0 z-10 bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]';
const FOOT = 'sticky bottom-0 z-10 bg-card shadow-[inset_0_1px_0_var(--border)]';
const TD = 'px-3 py-2.5 text-right tabular-nums whitespace-nowrap';
const dash = <span className="text-muted-foreground/60">—</span>;

const money = (n: number) => (n ? formatCurrency(n) : dash);
const count = (n: number) => (n ? n.toLocaleString() : dash);

export function PeriodTable({
  buckets,
  byMonth,
  today,
  isLoading,
}: {
  buckets: Bucket[];
  byMonth: boolean;
  today: string;
  isLoading?: boolean;
}) {
  const rows = [...buckets].reverse();
  const sum = (k: keyof Bucket) => buckets.reduce((n, b) => n + (b[k] as number), 0);
  const total = {
    spend: sum('spend'),
    conversations: sum('conversations'),
    chat_orders: sum('chat_orders'),
    chat_revenue: sum('chat_revenue'),
    revenue: sum('revenue'),
  };
  const cpc = (b: { spend: number; conversations: number }) => {
    const v = ratio(b.spend, b.conversations);
    return v == null ? dash : formatCurrency(v);
  };
  const roas = (b: { spend: number; chat_revenue: number }) => {
    const v = ratio(b.chat_revenue, b.spend);
    return v == null ? dash : times(v);
  };

  return (
    <Panel>
      <PanelHeader
        title={byMonth ? 'Month by month' : 'Day by day'}
        meta={byMonth ? 'newest first' : 'newest first, Malaysia time'}
      />
      <div className="px-2 pb-2 pt-1">
        <div className="relative max-h-[440px] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                <th className={cn(TH, 'text-left')}>{byMonth ? 'Month' : 'Date'}</th>
                <th className={cn(TH, 'text-right')}>Ad spend</th>
                <th className={cn(TH, 'text-right')}>Chats started</th>
                <th className={cn(TH, 'text-right')}>Cost per chat</th>
                <th className={cn(TH, 'text-right')} title="WhatsApp orders, not distributor, Shopee or Lazada">
                  WhatsApp orders
                </th>
                <th className={cn(TH, 'text-right')}>WhatsApp sales</th>
                <th className={cn(TH, 'text-right')} title="WhatsApp sales ÷ ad spend for the day, including customers who didn't come from an ad">
                  Blended ROAS
                </th>
                <th className={cn(TH, 'text-right')}>All sales</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((b) => (
                    <tr key={b.key} className="border-b border-border/60 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                        {b.label}
                        {!byMonth && b.key === today && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Today
                          </span>
                        )}
                      </td>
                      <td className={TD}>{money(b.spend)}</td>
                      <td className={TD}>{count(b.conversations)}</td>
                      <td className={TD}>{cpc(b)}</td>
                      <td className={TD}>{count(b.chat_orders)}</td>
                      <td className={TD}>{money(b.chat_revenue)}</td>
                      <td className={TD}>{roas(b)}</td>
                      <td className={cn(TD, 'text-muted-foreground')}>{money(b.revenue)}</td>
                    </tr>
                  ))}
            </tbody>
            {!isLoading && rows.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td className={cn(FOOT, 'px-3 py-2.5')}>Total</td>
                  <td className={cn(FOOT, TD)}>{formatCurrency(total.spend)}</td>
                  <td className={cn(FOOT, TD)}>{total.conversations.toLocaleString()}</td>
                  <td className={cn(FOOT, TD)}>{cpc(total)}</td>
                  <td className={cn(FOOT, TD)}>{total.chat_orders.toLocaleString()}</td>
                  <td className={cn(FOOT, TD)}>{formatCurrency(total.chat_revenue)}</td>
                  <td className={cn(FOOT, TD)}>{roas(total)}</td>
                  <td className={cn(FOOT, TD, 'font-normal text-muted-foreground')}>{formatCurrency(total.revenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Panel>
  );
}
