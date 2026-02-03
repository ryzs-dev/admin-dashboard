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
        <CardHeader className="flex gap-2 items-center">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Total Customers</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl font-bold">{stats.total_customers}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex gap-2 items-center">
          <Package className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Total Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl font-bold">{stats.total_orders}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex gap-2 items-center">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl font-bold">
            {formatCurrency(stats.total_revenue)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex gap-2 items-center">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Avg Order Value</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl font-bold">
            {formatCurrency(stats.average_order_value)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex gap-2 items-center">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Revenue MTD</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl font-bold">
            {formatCurrency(stats.mtd_revenue)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
};
