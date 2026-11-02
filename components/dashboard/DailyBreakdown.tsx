'use client';

import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { CustomerMixDTO, DailyBreakdownDTO } from '@/types/stats';
import { Panel, PanelHeader } from './Panel';

const TH = 'sticky top-0 z-10 bg-card px-3 py-2 text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 text-right tabular-nums';

// Malaysia date, matching how the server buckets orders into days.
function todayInMalaysia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
}

function Count({ value }: { value: number }) {
  return (
    <span className={value === 0 ? 'text-muted-foreground/60' : undefined}>
      {value.toLocaleString()}
    </span>
  );
}

export function DailyBreakdown({
  days,
  totals,
  isLoading,
  showAds,
}: {
  days: DailyBreakdownDTO[];
  totals: CustomerMixDTO | null;
  isLoading?: boolean;
  showAds?: boolean;
}) {
  const cols = showAds ? 7 : 5;
  const today = todayInMalaysia();
  // Newest first, and no rows for days that haven't happened yet.
  const rows = days.filter((d) => d.day <= today).reverse();

  const total = rows.reduce(
    (sum, d) => ({
      orders: sum.orders + d.orders,
      revenue: sum.revenue + d.revenue,
      ad_spend: sum.ad_spend + (d.ad_spend ?? 0),
    }),
    { orders: 0, revenue: 0, ad_spend: 0 }
  );

  const roas = (revenue: number, spend: number | null) =>
    spend ? `${(revenue / spend).toFixed(2)}×` : <span className="text-muted-foreground/60">—</span>;

  return (
    <Panel>
      <PanelHeader title="Day by day" meta="newest first, Malaysia time" />
      <div className="relative max-h-[420px] overflow-auto px-2 pb-2 pt-1">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b">
              <th className={cn(TH, 'text-left')}>Date</th>
              <th className={cn(TH, 'text-right')}>Orders</th>
              <th className={cn(TH, 'text-right')}>Revenue</th>
              <th className={cn(TH, 'text-right')} title="Customers whose first order was on this day">
                New customers
              </th>
              <th
                className={cn(TH, 'text-right')}
                title="Customers who had ordered before and ordered again on this day"
              >
                Returning customers
              </th>
              {showAds && (
                <>
                  <th className={cn(TH, 'text-right')}>Ad spend</th>
                  <th className={cn(TH, 'text-right')} title="Revenue ÷ ad spend for the day">
                    ROAS
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={cols} className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={cols} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No days to show for this month yet.
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.day} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-medium text-foreground">
                      {format(parseISO(d.day), 'EEE d MMM')}
                    </span>
                    {d.day === today && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Today
                      </span>
                    )}
                  </td>
                  <td className={TD}>
                    <Count value={d.orders} />
                  </td>
                  <td className={cn(TD, 'font-medium whitespace-nowrap')}>
                    {d.revenue === 0 ? (
                      <span className="font-normal text-muted-foreground/60">—</span>
                    ) : (
                      formatCurrency(d.revenue)
                    )}
                  </td>
                  <td className={TD}>
                    <Count value={d.new_customers} />
                  </td>
                  <td className={cn(TD, 'whitespace-nowrap')}>
                    <Count value={d.returning_customers} />
                    {d.returning_customers > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {formatCurrency(d.returning_revenue)}
                      </span>
                    )}
                  </td>
                  {showAds && (
                    <>
                      <td className={cn(TD, 'whitespace-nowrap')}>
                        {d.ad_spend ? formatCurrency(d.ad_spend) : <span className="text-muted-foreground/60">—</span>}
                      </td>
                      <td className={TD}>{roas(d.revenue, d.ad_spend)}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="sticky bottom-0 border-t bg-card font-semibold">
                <td className="px-3 py-2.5">Total</td>
                <td className={TD}>{total.orders.toLocaleString()}</td>
                <td className={cn(TD, 'whitespace-nowrap')}>{formatCurrency(total.revenue)}</td>
                <td className={TD} title="Each customer counted once for the month">
                  {totals ? totals.new_customers.toLocaleString() : '—'}
                </td>
                <td
                  className={cn(TD, 'whitespace-nowrap')}
                  title="Each customer counted once for the month, so this can be less than the days added up"
                >
                  {totals ? totals.returning_customers.toLocaleString() : '—'}
                  {totals && totals.returning_customers > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {formatCurrency(totals.returning_revenue)}
                    </span>
                  )}
                </td>
                {showAds && (
                  <>
                    <td className={cn(TD, 'whitespace-nowrap')}>{formatCurrency(total.ad_spend)}</td>
                    <td className={TD}>{roas(total.revenue, total.ad_spend)}</td>
                  </>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Panel>
  );
}
