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
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chartTheme';
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader } from './Panel';
import { Pace } from './pace';

type View = 'running' | 'daily';

const X_TICKS = [1, 8, 15, 22, 29];

export function RevenueChart({
  pace,
  monthName,
  previousMonthName,
  isLoading,
}: {
  pace: Pace;
  monthName: string;
  previousMonthName: string;
  isLoading?: boolean;
}) {
  const [view, setView] = useState<View>('running');
  const monthShort = monthName.slice(0, 3);
  const dayLabel = (day: number) => `${day} ${monthShort}`;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Revenue">
        <div className="flex items-center gap-4">
          {view === 'running' && (
            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full" style={{ background: CHART_COLORS.primary }} />
                {monthName}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full" style={{ background: CHART_COLORS.comparison }} />
                {previousMonthName}
              </span>
            </div>
          )}
          <div
            role="tablist"
            aria-label="Revenue view"
            className="flex rounded-md bg-muted p-0.5 text-xs"
          >
            {(
              [
                ['running', 'Running total'],
                ['daily', 'Per day'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={cn(
                  'rounded px-2.5 py-1 font-medium transition-colors',
                  view === value
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </PanelHeader>

      <div className="min-h-[248px] flex-1 px-2 pb-3 pt-2">
        {isLoading ? (
          <Skeleton className="mx-3 h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {view === 'running' ? (
              <LineChart data={pace.points} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid {...chartGrid} />
                <XAxis
                  dataKey="day"
                  {...chartAxis}
                  ticks={X_TICKS.filter((d) => d <= pace.points.length)}
                  tickFormatter={dayLabel}
                  interval={0}
                />
                <YAxis
                  {...chartAxis}
                  width={64}
                  tickCount={5}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip
                  {...chartTooltip}
                  labelFormatter={(day) => dayLabel(Number(day))}
                  formatter={(v, name) => [
                    formatCurrency(Number(v)),
                    name === 'current' ? `${monthName} so far` : `${previousMonthName} by then`,
                  ]}
                />
                <Line
                  type="linear"
                  dataKey="previous"
                  stroke={CHART_COLORS.comparison}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="current"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
              <BarChart data={pace.points} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid {...chartGrid} />
                <XAxis
                  dataKey="day"
                  {...chartAxis}
                  ticks={X_TICKS.filter((d) => d <= pace.points.length)}
                  tickFormatter={dayLabel}
                  interval={0}
                />
                <YAxis
                  {...chartAxis}
                  width={64}
                  tickCount={5}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip
                  {...chartTooltip}
                  labelFormatter={(day) => dayLabel(Number(day))}
                  formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                />
                <Bar
                  dataKey="daily"
                  fill={CHART_COLORS.primary}
                  maxBarSize={18}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}
