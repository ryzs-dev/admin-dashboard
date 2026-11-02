'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chartTheme';
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { Bucket } from './period';

function Key({ color, label, bar }: { color: string; label: string; bar?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={bar ? 'h-2.5 w-2.5 rounded-[2px]' : 'h-0.5 w-3 rounded-full'}
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// Spend as bars, WhatsApp sales as a line, on their own scales so both read.
export function SpendChart({
  buckets,
  byMonth,
  isLoading,
}: {
  buckets: Bucket[];
  byMonth: boolean;
  isLoading?: boolean;
}) {
  const every = byMonth ? 0 : Math.max(0, Math.ceil(buckets.length / 8) - 1);

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Spend and sales" meta={byMonth ? 'by month' : 'by day'}>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Key color={CHART_COLORS.primarySoft} label="Ad spend" bar />
          <Key color={CHART_COLORS.primary} label="WhatsApp sales" />
        </div>
      </PanelHeader>
      <div className="h-[280px] px-2 pb-3 pt-2">
        {isLoading ? (
          <Skeleton className="mx-3 h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={buckets} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="short" {...chartAxis} interval={every} minTickGap={8} />
              <YAxis
                yAxisId="spend"
                {...chartAxis}
                width={64}
                tickCount={5}
                tickFormatter={formatCurrencyShort}
              />
              <YAxis
                yAxisId="sales"
                orientation="right"
                {...chartAxis}
                width={64}
                tickCount={5}
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip
                {...chartTooltip}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                formatter={(v, name) => [
                  formatCurrency(Number(v)),
                  name === 'spend' ? 'Ad spend' : 'WhatsApp sales',
                ]}
              />
              <Bar
                yAxisId="spend"
                dataKey="spend"
                fill={CHART_COLORS.primarySoft}
                maxBarSize={byMonth ? 36 : 16}
                isAnimationActive={false}
              />
              <Line
                yAxisId="sales"
                type="linear"
                dataKey="chat_revenue"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}
