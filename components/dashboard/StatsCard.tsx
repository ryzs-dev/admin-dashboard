import { Receipt, ShoppingBag, Users, Wallet } from 'lucide-react';
import { StatCard } from '@/components/layout/StatCard';
import { formatCurrency } from '@/lib/utils/currency';

interface StatsCardProps {
  total_customers: number;
  total_revenue: number;
  average_order_value: number;
  mtd_revenue: number;
  total_orders: number;
}

export const StatsCards = ({
  stats,
  periodLabel,
  isLoading,
}: {
  stats: StatsCardProps;
  periodLabel: string;
  isLoading?: boolean;
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Orders"
        value={Number(stats.total_orders ?? 0).toLocaleString()}
        hint={periodLabel}
        icon={ShoppingBag}
        isLoading={isLoading}
      />
      <StatCard
        label="Revenue"
        value={formatCurrency(Number(stats.total_revenue ?? 0))}
        hint={periodLabel}
        icon={Wallet}
        isLoading={isLoading}
      />
      <StatCard
        label="Average order"
        value={formatCurrency(Number(stats.average_order_value ?? 0))}
        hint={periodLabel}
        icon={Receipt}
        isLoading={isLoading}
      />
      <StatCard
        label="Customers"
        value={Number(stats.total_customers ?? 0).toLocaleString()}
        hint="All time"
        icon={Users}
        isLoading={isLoading}
      />
    </div>
  );
};
