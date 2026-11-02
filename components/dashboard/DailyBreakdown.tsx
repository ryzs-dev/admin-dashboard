'use client';

import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { DailyBreakdownDTO } from '@/types/stats';
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
  isLoading,
}: {
  days: DailyBreakdownDTO[];
  isLoading?: boolean;
}) {
  const today = todayInMalaysia();
  // Newest first, and no rows for days that haven't happened yet.
  const rows = days.filter((d) => d.day <= today).reverse();

  const total = rows.reduce(
    (sum, d) => ({
      orders: sum.orders + d.orders,
      revenue: sum.revenue + d.revenue,
      new_customers: sum.new_customers + d.new_customers,
      returns: sum.returns + d.returns,
      returned_value: sum.returned_value + d.returned_value,
    }),
    { orders: 0, revenue: 0, new_customers: 0, returns: 0, returned_value: 0 }
  );

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
                title="Parcels the courier marked returned on this day"
              >
                Returns
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
                    <Count value={d.returns} />
                    {d.returns > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {formatCurrency(d.returned_value)}
                      </span>
                    )}
                  </td>
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
                <td className={TD}>{total.new_customers.toLocaleString()}</td>
                <td className={cn(TD, 'whitespace-nowrap')}>
                  {total.returns.toLocaleString()}
                  {total.returns > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {formatCurrency(total.returned_value)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Panel>
  );
}
