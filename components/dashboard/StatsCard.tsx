// components/dashboard/StatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Package } from "lucide-react";

export interface Stats {
  totalOrders: number;

  totalRevenue: number;

  avgOrderValue: number;

  totalSubscribers: number;

  conversionRate: number;

  funnelStages: Record<number, number>;
}

export const StatsCards = ({ stats }: { stats: Stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Subscribers</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Users className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">{stats.totalSubscribers}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Package className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">{stats.totalOrders}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">
            RM {stats.totalRevenue.toFixed(2)}
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
            RM {stats.avgOrderValue.toFixed(2)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {stats.conversionRate.toFixed(1)}%
          </span>
        </CardContent>
      </Card>
    </div>
  );
};
