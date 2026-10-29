'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chartTheme';
import { Panel, PanelHeader } from './Panel';

export function NewCustomersChart({
  data,
  partial,
  isLoading,
}: {
  data: { month: string; new_customers: number }[];
  partial: boolean;
  isLoading?: boolean;
}) {
  const points = data.map((d, i) => ({
    ...d,
    short: d.month.slice(0, 3) + (partial && i === data.length - 1 ? '*' : ''),
  }));

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="New customers" meta="first order, by month" />
      <div className="min-h-[200px] flex-1 px-2 pt-2">
        {isLoading ? (
          <Skeleton className="mx-3 h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="short" {...chartAxis} interval={0} />
              <YAxis {...chartAxis} width={36} tickCount={4} allowDecimals={false} />
              <Tooltip
                {...chartTooltip}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.month ?? ''}
                formatter={(v) => [Number(v).toLocaleString(), 'New customers']}
              />
              <Bar dataKey="new_customers" maxBarSize={32} isAnimationActive={false}>
                {points.map((p, i) => (
                  <Cell
                    key={p.month}
                    fill={i === points.length - 1 ? CHART_COLORS.primary : CHART_COLORS.comparison}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="px-5 pb-4 text-xs text-muted-foreground">
        {partial ? '* Month still running.' : ' '}
      </p>
    </Panel>
  );
}
