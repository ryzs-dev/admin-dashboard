import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { RepeatOrderValueDTO } from '@/types/stats';
import { UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SegmentProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'repeat' | 'new';
  revenue: number;
  share: number;
  averageLabel: string;
  average: number;
  orders: number;
  customers: number;
}

const TONES = {
  repeat: {
    panel: 'border-indigo-100 bg-indigo-50/60',
    icon: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-600',
    accent: 'text-indigo-700',
  },
  new: {
    panel: 'border-emerald-100 bg-emerald-50/60',
    icon: 'bg-emerald-500 text-white',
    dot: 'bg-emerald-500',
    accent: 'text-emerald-700',
  },
};

function Segment({
  title,
  description,
  icon: Icon,
  tone,
  revenue,
  share,
  averageLabel,
  average,
  orders,
  customers,
}: SegmentProps) {
  const colors = TONES[tone];

  return (
    <div className={cn('rounded-xl border p-5', colors.panel)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            colors.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight">
          {formatCurrency(revenue)}
        </p>
        <p className={cn('text-sm font-medium', colors.accent)}>
          {share.toFixed(1)}% of revenue
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x rounded-lg bg-white/80 py-3 text-center">
        <div className="px-2">
          <dt className="text-xs text-muted-foreground">{averageLabel}</dt>
          <dd className="mt-1 font-semibold">{formatCurrency(average)}</dd>
        </div>
        <div className="px-2">
          <dt className="text-xs text-muted-foreground">Orders</dt>
          <dd className="mt-1 font-semibold">{orders.toLocaleString()}</dd>
        </div>
        <div className="px-2">
          <dt className="text-xs text-muted-foreground">Customers</dt>
          <dd className="mt-1 font-semibold">{customers.toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}

export function RepeatOrderValueCard({
  data,
  isLoading,
  periodLabel,
}: {
  data: RepeatOrderValueDTO;
  isLoading?: boolean;
  periodLabel?: string;
}) {
  const repeatShare = Math.min(Math.max(data.repeat_revenue_share, 0), 100);
  const hasRevenue = data.repeat_revenue + data.new_revenue > 0;
  const averageGap =
    data.new_average_order_value > 0
      ? ((data.repeat_average_order_value - data.new_average_order_value) /
          data.new_average_order_value) *
        100
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Repeat vs First-time Customers</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Orders {periodLabel ? `in ${periodLabel}` : 'this month'}, split by
            whether the customer had bought before
          </p>
        </div>
        {!isLoading && data.repeat_orders > 0 && data.new_orders > 0 && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            Repeat orders are{' '}
            <span className={averageGap >= 0 ? 'text-indigo-700' : 'text-rose-600'}>
              {Math.abs(averageGap).toFixed(1)}% {averageGap >= 0 ? 'larger' : 'smaller'}
            </span>{' '}
            on average
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {hasRevenue && (
                  <>
                    <div
                      className="bg-indigo-600 transition-all"
                      style={{ width: `${repeatShare}%` }}
                    />
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${100 - repeatShare}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  Repeat {repeatShare.toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5">
                  First-time {hasRevenue ? (100 - repeatShare).toFixed(1) : '0.0'}%
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Segment
                title="Returning customers"
                description="Customers who had ordered before"
                icon={Users}
                tone="repeat"
                revenue={data.repeat_revenue}
                share={repeatShare}
                averageLabel="Avg order"
                average={data.repeat_average_order_value}
                orders={data.repeat_orders}
                customers={data.repeat_customers}
              />
              <Segment
                title="First-time customers"
                description="Each customer's very first order"
                icon={UserPlus}
                tone="new"
                revenue={data.new_revenue}
                share={hasRevenue ? 100 - repeatShare : 0}
                averageLabel="Avg 1st order"
                average={data.new_average_order_value}
                orders={data.new_orders}
                customers={data.new_orders}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
