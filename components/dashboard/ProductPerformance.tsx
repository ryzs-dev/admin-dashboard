'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { ProductPerformanceDTO } from '@/types/stats';
import { Change, Panel, PanelHeader } from './Panel';
import { percentChange } from './pace';

const TH = 'px-3 py-2 text-xs font-normal text-muted-foreground';

export function TopProductsTable({
  products,
  isLoading,
  previousMonthName,
  partial,
  onSelect,
}: {
  products: ProductPerformanceDTO[];
  isLoading?: boolean;
  previousMonthName: string;
  partial: boolean;
  onSelect: (productId: string) => void;
}) {
  const prevShort = previousMonthName.slice(0, 3);
  const sorted = [...products].sort((a, b) => b.total_revenue - a.total_revenue);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Products" meta="select one for its 6-month trend" />
      <div className="relative overflow-x-auto px-2 pb-2 pt-1">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b">
              <th className={cn(TH, 'text-left')}>Product</th>
              <th className={cn(TH, 'text-right')}>Revenue</th>
              <th className={cn(TH, 'text-right')}>
                {partial ? `All of ${prevShort}` : `vs ${prevShort}`}
              </th>
              <th className={cn(TH, 'text-right')}>Orders</th>
              <th className={cn(TH, 'text-right')}>Units</th>
              <th className={cn(TH, 'text-right')} title="Share of lifetime buyers who bought again">
                Return rate
              </th>
              <th className="w-8">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No product sales in this month.
                </td>
              </tr>
            ) : (
              sorted.map((product) => (
                <tr
                  key={product.product_id}
                  tabIndex={0}
                  onClick={() => onSelect(product.product_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(product.product_id);
                    }
                  }}
                  className="group cursor-pointer rounded-md outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <td className="px-3 py-3 font-medium text-foreground">
                    {product.product_name}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                    {formatCurrency(product.total_revenue)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                    {partial ? (
                      formatCurrency(product.previous_month_revenue)
                    ) : (
                      <Change
                        value={percentChange(
                          product.total_revenue,
                          product.previous_month_revenue
                        )}
                      />
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {product.total_orders.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {product.quantity_sold.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {product.repeat_customer_rate.toFixed(1)}%
                  </td>
                  <td className="pr-2 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-auto flex justify-end px-5 pb-4 pt-1">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all orders
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Panel>
  );
}
