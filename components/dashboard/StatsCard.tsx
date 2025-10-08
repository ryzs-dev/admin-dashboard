// components/dashboard/StatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { Users, DollarSign, TrendingUp, Package } from 'lucide-react';

interface StatsCardProps {
  total_customers: number;
  total_revenue: number;
  average_order_value: number;
  mtd_revenue: number;
  total_orders: number;
}

export const StatsCards = ({ stats }: { stats: StatsCardProps }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Customers</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Users className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">{stats.total_customers}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Package className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">{stats.total_orders}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {formatCurrency(stats.total_revenue)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avg Order Value</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {formatCurrency(stats.average_order_value)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue MTD</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {formatCurrency(stats.mtd_revenue)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
};
