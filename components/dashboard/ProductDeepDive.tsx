'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <CardTitle>Product Deep Dive</CardTitle>
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
                label="Selected Month Revenue"
                value={formatCurrency(selectedProduct.total_revenue)}
              />
              <MetricCard
                label="Repeat Customer Rate"
                value={`${selectedProduct.repeat_customer_rate.toFixed(1)}%`}
              />
              <MetricCard
                label="Unique Customers"
                value={String(selectedProduct.unique_customers)}
              />
              <MetricCard
                label="Customer LTV"
                value={formatCurrency(selectedProduct.customer_lifetime_value)}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard title="Monthly Sales Trend">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="quantity_sold"
                      name="Quantity Sold"
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly Repeat Purchase Trend">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="repeat_customer_rate"
                      name="Repeat Rate %"
                      stroke="#9333ea"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="First-Time vs Returning Buyers">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="first_time_buyers"
                      name="First-Time Buyers"
                      fill="#2563eb"
                    />
                    <Bar
                      dataKey="returning_buyers"
                      name="Returning Buyers"
                      fill="#16a34a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue & Retention Trend">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="repeat_customer_rate"
                      name="Retention %"
                      stroke="#f97316"
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
    <div className="rounded-lg border bg-white p-4">
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
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-medium mb-4">{title}</h3>
      {children}
    </div>
  );
}
