import { CalendarDays, Receipt, ShoppingBag, Wallet } from 'lucide-react';
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
  const stats = [
    { label: 'Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag },
    { label: 'Total spent', value: formatCurrency(totalSpent), icon: Wallet },
    {
      label: 'Average order',
      value: totalOrders ? formatCurrency(totalSpent / totalOrders) : '—',
      icon: Receipt,
    },
    {
      label: 'Last order',
      value: lastOrderLabel ?? '—',
      hint: lastOrderHint,
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {label}
            <Icon className="h-4 w-4" />
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      ))}
    </div>
  );
}
