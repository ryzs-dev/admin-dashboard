import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { averageCalculator } from '@/lib/utils/averageCalculator';
import { formatCurrency } from '@/lib/utils/currency';
import { ShoppingBag, DollarSign, Package } from 'lucide-react';

interface CustomerStatsCardProps {
  customer: {
    total_purchases: number;
    amount_spent: number;
  };
}

export default function CustomerStatsCard({
  customer,
}: CustomerStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Purchases</p>
            <p className="text-2xl font-semibold">{customer.total_purchases}</p>
          </div>
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(customer.amount_spent)}
            </p>
          </div>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Average Order</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(
                averageCalculator(
                  customer.total_purchases,
                  customer.amount_spent
                )
              ) || 0}
            </p>
          </div>
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
