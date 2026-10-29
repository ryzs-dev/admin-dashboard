import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS } from '@/lib/chartTheme';
import { formatCurrency } from '@/lib/utils/currency';
import { RepeatOrderValueDTO } from '@/types/stats';
import { Panel, PanelHeader } from './Panel';

// Repeat vs first-time only covers WhatsApp orders: marketplace orders have no CRM customer.
export function RepeatOrderValueCard({
  data,
  isLoading,
}: {
  data: RepeatOrderValueDTO;
  isLoading?: boolean;
}) {
  const total = data.repeat_revenue + data.new_revenue;
  const repeatShare = total > 0 ? (data.repeat_revenue / total) * 100 : 0;
  const lift =
    data.new_average_order_value > 0
      ? ((data.repeat_average_order_value - data.new_average_order_value) /
          data.new_average_order_value) *
        100
      : null;

  const rows = [
    {
      label: 'Returning',
      color: CHART_COLORS.primary,
      revenue: data.repeat_revenue,
      orders: data.repeat_orders,
      average: data.repeat_average_order_value,
    },
    {
      label: 'First-time',
      color: CHART_COLORS.primarySoft,
      revenue: data.new_revenue,
      orders: data.new_orders,
      average: data.new_average_order_value,
    },
  ];

  return (
    <Panel>
      <PanelHeader title="WhatsApp buyers" meta="returning vs first-time" />
      <div className="px-5 pb-4 pt-3">
        {isLoading ? (
          <Skeleton className="h-1.5 w-full" />
        ) : (
          <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
            {total > 0 && (
              <>
                <div style={{ width: `${repeatShare}%`, background: CHART_COLORS.primary }} />
                <div className="flex-1" style={{ background: CHART_COLORS.primarySoft }} />
              </>
            )}
          </div>
        )}

        {/* Phone: one two-line row per buyer type; the table returns from sm up. */}
        <ul className="mt-3 space-y-2 text-sm sm:hidden">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                {row.label}
                <span className="ml-auto font-medium tabular-nums">
                  {formatCurrency(row.revenue)}
                </span>
              </div>
              <p className="pl-4 text-xs tabular-nums text-muted-foreground">
                {row.orders.toLocaleString()} orders · avg {formatCurrency(row.average)}
              </p>
            </li>
          ))}
        </ul>

        <table className="mt-3 hidden w-full text-sm sm:table">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="pb-1 text-left font-normal">
                <span className="sr-only">Buyer type</span>
              </th>
              <th className="pb-1 pl-3 text-right font-normal">Revenue</th>
              <th className="pb-1 pl-3 text-right font-normal">Orders</th>
              <th className="pb-1 pl-3 text-right font-normal">Avg order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="py-1">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                    {row.label}
                  </span>
                </td>
                <td className="whitespace-nowrap py-1 pl-3 text-right font-medium tabular-nums">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="whitespace-nowrap py-1 pl-3 text-right tabular-nums text-muted-foreground">
                  {row.orders.toLocaleString()}
                </td>
                <td className="whitespace-nowrap py-1 pl-3 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(row.average)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {lift !== null && !isLoading && (
          <p className="mt-2 text-xs text-muted-foreground">
            Returning customers spend{' '}
            <span className="font-medium text-foreground tabular-nums">
              {Math.abs(lift).toFixed(1)}% {lift >= 0 ? 'more' : 'less'}
            </span>{' '}
            per order than first-timers.
          </p>
        )}
      </div>
    </Panel>
  );
}
