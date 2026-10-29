'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chartTheme';
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { ProductMonthlyTrendDTO, ProductPerformanceDTO } from '@/types/stats';

type Metric = 'revenue' | 'quantity_sold' | 'repeat_customer_rate';

const METRICS: { value: Metric; label: string; format: (v: number) => string; axis: (v: number) => string }[] = [
  { value: 'revenue', label: 'Revenue', format: formatCurrency, axis: formatCurrencyShort },
  {
    value: 'quantity_sold',
    label: 'Units',
    format: (v) => v.toLocaleString(),
    axis: (v) => v.toLocaleString(),
  },
  {
    value: 'repeat_customer_rate',
    label: 'Return rate',
    format: (v) => `${v.toFixed(1)}%`,
    axis: (v) => `${v}%`,
  },
];

export function ProductDetailSheet({
  product,
  trends,
  isLoading,
  onClose,
}: {
  product: ProductPerformanceDTO | null;
  trends: ProductMonthlyTrendDTO[];
  isLoading?: boolean;
  onClose: () => void;
}) {
  const [metric, setMetric] = useState<Metric>('revenue');
  const active = METRICS.find((m) => m.value === metric)!;
  const points = trends.map((t) => ({ ...t, short: t.month_label.slice(0, 3) }));

  const facts = product
    ? [
        ['Revenue this month', formatCurrency(product.total_revenue)],
        ['Lifetime buyers', product.unique_customers.toLocaleString()],
        ['Bought again', `${product.repeat_customer_rate.toFixed(1)}%`],
        ['Spent per buyer', formatCurrency(product.customer_lifetime_value)],
      ]
    : [];

  return (
    <Sheet open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg">{product?.product_name}</SheetTitle>
          <SheetDescription>Last 6 months, and what its buyers do over their lifetime.</SheetDescription>
        </SheetHeader>

        <dl className="grid grid-cols-2 border-b">
          {facts.map(([label, value], i) => (
            <div
              key={label}
              className={cn('px-6 py-4', i % 2 === 0 && 'border-r', i < 2 && 'border-b')}
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <section className="border-b px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">By month</h3>
            <div role="tablist" aria-label="Metric" className="flex rounded-md bg-muted p-0.5 text-xs">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  role="tab"
                  aria-selected={metric === m.value}
                  onClick={() => setMetric(m.value)}
                  className={cn(
                    'rounded px-2.5 py-1 font-medium transition-colors',
                    metric === m.value
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-[200px]">
            {isLoading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...chartGrid} />
                  <XAxis dataKey="short" {...chartAxis} interval={0} />
                  <YAxis {...chartAxis} width={56} tickCount={5} tickFormatter={active.axis} />
                  <Tooltip
                    {...chartTooltip}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.month_label ?? ''}
                    formatter={(v) => [active.format(Number(v)), active.label]}
                  />
                  <Line
                    type="linear"
                    dataKey={metric}
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Buyers by month</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS.primary }} />
                Returning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS.primarySoft }} />
                First-time
              </span>
            </div>
          </div>
          <div className="mt-3 h-[180px]">
            {isLoading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...chartGrid} />
                  <XAxis dataKey="short" {...chartAxis} interval={0} />
                  <YAxis {...chartAxis} width={56} tickCount={4} allowDecimals={false} />
                  <Tooltip
                    {...chartTooltip}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.month_label ?? ''}
                  />
                  <Bar
                    dataKey="returning_buyers"
                    name="Returning"
                    stackId="buyers"
                    fill={CHART_COLORS.primary}
                    maxBarSize={32}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="first_time_buyers"
                    name="First-time"
                    stackId="buyers"
                    fill={CHART_COLORS.primarySoft}
                    maxBarSize={32}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}
