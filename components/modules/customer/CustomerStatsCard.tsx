import { StatCard } from '@/components/layout/StatCard';
import { formatCurrency } from '@/lib/utils/currency';

interface CustomerStatsCardProps {
  totalOrders: number;
  totalSpent: number;
  lastOrderLabel?: string;
  lastOrderHint?: string;
}

export default function CustomerStatsCard({
  totalOrders,
  totalSpent,
  lastOrderLabel,
  lastOrderHint,
}: CustomerStatsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Orders" value={totalOrders.toLocaleString()} />
      <StatCard label="Total spent" value={formatCurrency(totalSpent)} />
      <StatCard
        label="Average order"
        value={totalOrders ? formatCurrency(totalSpent / totalOrders) : '—'}
      />
      <StatCard
        label="Last order"
        value={lastOrderLabel ?? '—'}
        hint={lastOrderHint}
      />
    </div>
  );
}
