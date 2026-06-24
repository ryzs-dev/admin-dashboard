'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';
import { ProductPerformanceDTO } from '@/types/stats';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

function TrendBadge({ trend }: { trend: ProductPerformanceDTO['revenue_trend'] }) {
  if (trend === 'increasing') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
        <ArrowUpRight className="h-3.5 w-3.5" />
        Increasing
      </span>
    );
  }

  if (trend === 'decreasing') {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
        <ArrowDownRight className="h-3.5 w-3.5" />
        Decreasing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium">
      <ArrowRight className="h-3.5 w-3.5" />
      Stable
    </span>
  );
}

export function TopProductsTable({
  products,
  isLoading,
}: {
  products: ProductPerformanceDTO[];
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading product analytics...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No product sales found for this period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Repeat Customer %</TableHead>
                <TableHead className="text-right">Avg Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.total_revenue)}
                  </TableCell>
                  <TableCell className="text-right">{product.total_orders}</TableCell>
                  <TableCell className="text-right">
                    {product.repeat_customer_rate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.average_order_value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductPerformanceInsights({
  products,
  isLoading,
}: {
  products: ProductPerformanceDTO[];
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product ROI Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No product insights available for this period.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="rounded-lg border bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.unique_customers} unique customers
                    </p>
                  </div>
                  <TrendBadge trend={product.revenue_trend} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">
                      {formatCurrency(product.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Orders</p>
                    <p className="font-medium">{product.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Repeat Rate</p>
                    <p className="font-medium">
                      {product.repeat_customer_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer LTV</p>
                    <p className="font-medium">
                      {formatCurrency(product.customer_lifetime_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Qty Sold</p>
                    <p className="font-medium">{product.quantity_sold}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Repeat Customers</p>
                    <p className="font-medium">{product.repeat_customers}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
