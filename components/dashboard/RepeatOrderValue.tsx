import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { RepeatOrderValueDTO } from '@/types/stats';
import { Repeat } from 'lucide-react';

export function RepeatOrderValueCard({
  data,
  isLoading,
}: {
  data: RepeatOrderValueDTO;
  isLoading?: boolean;
}) {
  const share = Math.min(Math.max(data.repeat_revenue_share, 0), 100);

  return (
    <Card>
      <CardHeader className="flex gap-2 items-center">
        <Repeat className="h-4 w-4 text-muted-foreground" />
        <CardTitle>Repeat Customer Order Value</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading repeat order value...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Repeat Revenue</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data.repeat_revenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.repeat_revenue_share.toFixed(1)}% of revenue
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Repeat Orders</p>
                <p className="text-xl font-bold">{data.repeat_orders}</p>
                <p className="text-xs text-muted-foreground">
                  from {data.repeat_customers} returning customers
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Repeat Order</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data.repeat_average_order_value)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg First Order</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data.new_average_order_value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.new_orders} orders from new customers
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-blue-100">
                <div className="bg-blue-600" style={{ width: `${share}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Repeat {formatCurrency(data.repeat_revenue)}
                </span>
                <span>New {formatCurrency(data.new_revenue)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
