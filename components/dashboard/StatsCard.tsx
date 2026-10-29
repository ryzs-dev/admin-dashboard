import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { DashboardStatsDTO } from '@/types/stats';
import { Change, Panel } from './Panel';
import { Pace, percentChange } from './pace';

type Props = {
  stats: DashboardStatsDTO;
  previousStats: DashboardStatsDTO;
  pace: Pace;
  newCustomers: number | null;
  previousNewCustomers: number | null;
  monthName: string;
  previousMonthName: string;
  previousRangeLabel: string;
  isLoading?: boolean;
};

function Cell({
  label,
  value,
  lead,
  isLoading,
  children,
}: {
  label: string;
  value: string;
  lead?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className={cn('mt-1.5', lead ? 'h-8 w-40' : 'h-6 w-24')} />
      ) : (
        <p
          className={cn(
            'mt-1 truncate tabular-nums tracking-tight text-foreground',
            lead ? 'text-[30px] font-bold leading-9' : 'text-2xl font-medium leading-8'
          )}
        >
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

export const StatsCards = ({
  stats,
  previousStats,
  pace,
  newCustomers,
  previousNewCustomers,
  monthName,
  previousMonthName,
  previousRangeLabel,
  isLoading,
}: Props) => {
  const prevShort = previousMonthName.slice(0, 3);

  return (
    <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4 [&>*]:bg-card [&>*:first-child]:col-span-2 [&>*:last-child]:col-span-2 lg:[&>*:first-child]:col-span-1 lg:[&>*:last-child]:col-span-1">
      <Cell
        label={pace.partial ? `Revenue so far in ${monthName}` : `Revenue in ${monthName}`}
        value={formatCurrency(Number(stats.total_revenue ?? 0))}
        lead
        isLoading={isLoading}
      >
        <Change value={pace.change} /> vs {previousRangeLabel}{' '}
        <span className="tabular-nums">({formatCurrency(pace.previous)})</span>
      </Cell>

      <Cell
        label="Orders"
        value={Number(stats.total_orders ?? 0).toLocaleString()}
        isLoading={isLoading}
      >
        {pace.partial ? (
          <>
            <span className="tabular-nums">
              {Number(previousStats.total_orders ?? 0).toLocaleString()}
            </span>{' '}
            in all of {previousMonthName}
          </>
        ) : (
          <>
            <Change
              value={percentChange(stats.total_orders, previousStats.total_orders)}
            />{' '}
            vs {prevShort} ({Number(previousStats.total_orders ?? 0).toLocaleString()})
          </>
        )}
      </Cell>

      <Cell
        label="Average order"
        value={formatCurrency(Number(stats.average_order_value ?? 0))}
        isLoading={isLoading}
      >
        <Change
          value={percentChange(
            stats.average_order_value,
            previousStats.average_order_value
          )}
        />{' '}
        vs {formatCurrency(Number(previousStats.average_order_value ?? 0))} in {prevShort}
      </Cell>

      <Cell
        label="New customers"
        value={newCustomers === null ? '—' : newCustomers.toLocaleString()}
        isLoading={isLoading}
      >
        {previousNewCustomers !== null && (
          <>
            <span className="tabular-nums">{previousNewCustomers.toLocaleString()}</span>{' '}
            {pace.partial ? `in all of ${previousMonthName}` : `in ${prevShort}`} ·{' '}
          </>
        )}
        <span className="tabular-nums">
          {Number(stats.total_customers ?? 0).toLocaleString()}
        </span>{' '}
        all time
      </Cell>
    </Panel>
  );
};
