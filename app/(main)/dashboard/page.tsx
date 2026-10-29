'use client';

import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import {
  useProductMonthlyTrends,
  useProductPerformance,
  useStats,
} from '@/hooks/useStats';
import { StatsCards } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ChannelBreakdown } from '@/components/dashboard/ChannelBreakdown';
import { RepeatOrderValueCard } from '@/components/dashboard/RepeatOrderValue';
import { NewCustomersChart } from '@/components/dashboard/NewCustomersChart';
import { TopProductsTable } from '@/components/dashboard/ProductPerformance';
import { ProductDetailSheet } from '@/components/dashboard/ProductDeepDive';
import { buildPace } from '@/components/dashboard/pace';
import { downloadMonthExport } from '@/lib/api/stats';
import { getCurrentMonthKey, parseMonthKey } from '@/lib/utils/date';
import { addMonths, format } from 'date-fns';

const CRMDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey());
  const [exporting, setExporting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const currentDate = parseMonthKey(selectedMonth);
  const previousDate = addMonths(currentDate, -1);
  const previousMonth = format(previousDate, 'yyyy-MM');
  const isCurrentMonth = selectedMonth >= getCurrentMonthKey();
  const monthName = format(currentDate, 'MMMM');
  const previousMonthName = format(previousDate, 'MMMM');

  const {
    stats,
    repeatOrderValue,
    channels,
    revenueChart,
    customerChart,
    isLoading: statsLoading,
  } = useStats(selectedMonth);
  const {
    stats: previousStats,
    revenueChart: previousRevenueChart,
    isLoading: previousLoading,
  } = useStats(previousMonth);
  const { products, isLoading: productsLoading } = useProductPerformance(selectedMonth);
  const { trends, isLoading: trendsLoading } = useProductMonthlyTrends(
    selectedProductId,
    selectedMonth
  );

  const pace = useMemo(
    () => buildPace(revenueChart, previousRevenueChart, isCurrentMonth),
    [revenueChart, previousRevenueChart, isCurrentMonth]
  );

  const comparedDays = Math.min(pace.daysElapsed, previousRevenueChart.length);
  const previousRangeLabel = pace.partial
    ? `1–${comparedDays} ${previousMonthName.slice(0, 3)}`
    : previousMonthName;

  const monthCustomers = (date: Date) =>
    customerChart.find((c) => c.month === format(date, 'MMM yyyy'))?.new_customers ?? null;

  const loading = statsLoading || previousLoading;

  const finding = (() => {
    if (loading) return `Sales for ${format(currentDate, 'MMMM yyyy')}.`;
    const lead = `${formatCurrency(Number(stats.total_revenue ?? 0))} from ${Number(
      stats.total_orders ?? 0
    ).toLocaleString()} orders${pace.partial ? ` in the first ${pace.daysElapsed} days` : ''}`;
    if (pace.change === null) return `${lead}.`;
    const pct = Math.abs(pace.change).toFixed(1);
    const direction = pace.change >= 0 ? 'ahead of' : 'behind';
    return pace.partial
      ? `${lead}, ${pct}% ${direction} the same days of ${previousMonthName}.`
      : `${lead}, ${pct}% ${pace.change >= 0 ? 'more than' : 'less than'} ${previousMonthName}.`;
  })();

  const selectedProduct =
    products.find((p) => p.product_id === selectedProductId) ?? null;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="pb-2">
          <PageHeader title="Dashboard" description={finding}>
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
                onClick={() => setSelectedMonth(previousMonth)}
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
        </div>

        <StatsCards
          stats={stats}
          previousStats={previousStats}
          pace={pace}
          newCustomers={monthCustomers(currentDate)}
          previousNewCustomers={monthCustomers(previousDate)}
          monthName={monthName}
          previousMonthName={previousMonthName}
          previousRangeLabel={previousRangeLabel}
          isLoading={loading}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <RevenueChart
              pace={pace}
              monthName={monthName}
              previousMonthName={previousMonthName}
              isLoading={loading}
            />
          </div>
          <div className="min-w-0">
            <NewCustomersChart
              data={customerChart}
              partial={pace.partial}
              isLoading={statsLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <TopProductsTable
              products={products}
              isLoading={productsLoading}
              previousMonthName={previousMonthName}
              partial={pace.partial}
              onSelect={setSelectedProductId}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <ChannelBreakdown channels={channels} isLoading={statsLoading} />
            <RepeatOrderValueCard data={repeatOrderValue} isLoading={statsLoading} />
          </div>
        </div>
      </div>

      <ProductDetailSheet
        product={selectedProduct}
        trends={trends}
        isLoading={trendsLoading}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
};

export default CRMDashboard;
