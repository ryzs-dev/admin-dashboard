'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chartTheme';
import { formatCurrency } from '@/lib/utils/currency';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useProductMonthlyTrends,
  useProductPerformance,
  useStats,
} from '@/hooks/useStats';
import { StatsCards } from '@/components/dashboard/StatsCard';
import { ChannelBreakdown } from '@/components/dashboard/ChannelBreakdown';
import { RepeatOrderValueCard } from '@/components/dashboard/RepeatOrderValue';
import {
  ProductPerformanceInsights,
  TopProductsTable,
} from '@/components/dashboard/ProductPerformance';
import { ProductDeepDive } from '@/components/dashboard/ProductDeepDive';
import { downloadMonthExport } from '@/lib/api/stats';
import { getCurrentMonthKey, parseMonthKey } from '@/lib/utils/date';
import { addMonths, format } from 'date-fns';

function findDefaultProductId(
  products: { product_id: string; product_name: string }[]
) {
  return (
    products.find((product) => /femrose|femlift/i.test(product.product_name))
      ?.product_id ??
    products[0]?.product_id ??
    null
  );
}

const CRMDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey());
  const [exporting, setExporting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const {
    stats,
    repeatOrderValue,
    channels,
    revenueChart,
    customerChart,
    isLoading: statsLoading,
  } = useStats(selectedMonth);
  const {
    products,
    isLoading: productsLoading,
  } = useProductPerformance(selectedMonth);
  const {
    trends,
    isLoading: trendsLoading,
  } = useProductMonthlyTrends(selectedProductId, selectedMonth);

  const currentDate = parseMonthKey(selectedMonth);
  const isCurrentMonth = selectedMonth >= getCurrentMonthKey();
  const periodLabel = format(currentDate, 'MMMM yyyy');

  const defaultProductId = useMemo(
    () => findDefaultProductId(products),
    [products]
  );

  useEffect(() => {
    if (!selectedProductId && defaultProductId) {
      setSelectedProductId(defaultProductId);
    }
  }, [defaultProductId, selectedProductId]);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Dashboard"
          description="Sales, repeat orders and products for the month."
        >
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await downloadMonthExport(selectedMonth);
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing…' : 'Download'}
          </Button>
          <div className="flex items-center rounded-lg border bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              aria-label="Previous month"
              onClick={() =>
                setSelectedMonth(format(addMonths(currentDate, -1), 'yyyy-MM'))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-32 border-x px-3 text-center text-sm font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              aria-label="Next month"
              disabled={isCurrentMonth}
              onClick={() =>
                setSelectedMonth(format(addMonths(currentDate, 1), 'yyyy-MM'))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </PageHeader>

        <StatsCards stats={stats} periodLabel={periodLabel} isLoading={statsLoading} />

        <ChannelBreakdown channels={channels} isLoading={statsLoading} />

        <RepeatOrderValueCard
          data={repeatOrderValue}
          isLoading={statsLoading}
          periodLabel={periodLabel}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily revenue</CardTitle>
              <p className="text-sm text-muted-foreground">{periodLabel}</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChart} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid {...chartGrid} />
                  <XAxis dataKey="label" {...chartAxis} minTickGap={16} />
                  <YAxis
                    {...chartAxis}
                    width={56}
                    tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  />
                  <Tooltip
                    {...chartTooltip}
                    formatter={(v: number) => [formatCurrency(Number(v)), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New customers</CardTitle>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={customerChart} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid {...chartGrid} />
                  <XAxis dataKey="month" {...chartAxis} />
                  <YAxis {...chartAxis} width={40} allowDecimals={false} />
                  <Tooltip
                    {...chartTooltip}
                    formatter={(v: number) => [Number(v).toLocaleString(), 'New customers']}
                  />
                  <Bar
                    dataKey="new_customers"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <TopProductsTable products={products} isLoading={productsLoading} />
        <ProductPerformanceInsights
          products={products}
          isLoading={productsLoading}
        />
        <ProductDeepDive
          products={products}
          trends={trends}
          selectedProductId={selectedProductId}
          onProductChange={setSelectedProductId}
          isLoading={productsLoading || trendsLoading}
        />
      </div>
    </div>
  );
};

export default CRMDashboard;
