'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CHART_COLORS,
  chartAxis,
  chartGrid,
  chartLegend,
  chartTooltip,
} from '@/lib/chartTheme';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/currency';
import { ProductPerformanceDTO, ProductMonthlyTrendDTO } from '@/types/stats';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function ProductDeepDive({
  products,
  trends,
  selectedProductId,
  onProductChange,
  isLoading,
}: {
  products: ProductPerformanceDTO[];
  trends: ProductMonthlyTrendDTO[];
  selectedProductId: string | null;
  onProductChange: (productId: string) => void;
  isLoading?: boolean;
}) {
  const selectedProduct = products.find(
    (product) => product.product_id === selectedProductId
  );

  const chartData = trends.map((trend) => ({
    ...trend,
    label: trend.month_label,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Product deep dive</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly sales, retention, and buyer mix for a selected product.
          </p>
        </div>

        <Select
          value={selectedProductId ?? undefined}
          onValueChange={onProductChange}
        >
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.product_id} value={product.product_id}>
                {product.product_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading product trends...</p>
        ) : !selectedProduct ? (
          <p className="text-sm text-muted-foreground">
            Select a product to view detailed analytics.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Revenue this month"
                value={formatCurrency(selectedProduct.total_revenue)}
              />
              <MetricCard
                label="Return rate (lifetime)"
                value={`${selectedProduct.repeat_customer_rate.toFixed(1)}%`}
              />
              <MetricCard
                label="Lifetime buyers"
                value={String(selectedProduct.unique_customers)}
              />
              <MetricCard
                label="Avg spent per buyer"
                value={formatCurrency(selectedProduct.customer_lifetime_value)}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard title="Monthly sales">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="label" {...chartAxis} />
                    <YAxis {...chartAxis} />
                    <Tooltip {...chartTooltip} />
                    <Legend {...chartLegend} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="quantity_sold"
                      name="Units sold"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly return rate">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="label" {...chartAxis} />
                    <YAxis {...chartAxis} />
                    <Tooltip {...chartTooltip} />
                    <Legend {...chartLegend} />
                    <Line
                      type="monotone"
                      dataKey="repeat_customer_rate"
                      name="Return rate %"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="First-time vs returning buyers">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="label" {...chartAxis} />
                    <YAxis {...chartAxis} />
                    <Tooltip {...chartTooltip} />
                    <Legend {...chartLegend} />
                    <Bar
                      dataKey="first_time_buyers"
                      name="First-time buyers"
                      fill={CHART_COLORS.secondary}
                    />
                    <Bar
                      dataKey="returning_buyers"
                      name="Returning buyers"
                      fill={CHART_COLORS.primary}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue and retention">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="label" {...chartAxis} />
                    <YAxis yAxisId="left" {...chartAxis} />
                    <YAxis yAxisId="right" orientation="right" {...chartAxis} />
                    <Tooltip {...chartTooltip} />
                    <Legend {...chartLegend} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="repeat_customer_rate"
                      name="Return rate %"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-medium mb-4">{title}</h3>
      {children}
    </div>
  );
}
