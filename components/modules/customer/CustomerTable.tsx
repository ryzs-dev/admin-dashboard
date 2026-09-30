import { Customer, CustomerSortField } from './types';
import { ArrowDown, ArrowUp, ArrowUpDown, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type CustomerTableProps = {
  customers: Customer[];
  search: string;
  sortBy: CustomerSortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: CustomerSortField) => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  pageSize: number;
};

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSortChange,
  align = 'left',
}: {
  label: string;
  field: CustomerSortField;
  sortBy: CustomerSortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: CustomerSortField) => void;
  align?: 'left' | 'right';
}) {
  const isActive = sortBy === field;
  const Icon = !isActive ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th className={cn('px-6 py-3', align === 'right' && 'text-right')}>
      <button
        type="button"
        onClick={() => onSortChange(field)}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors hover:text-gray-900',
          isActive ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', !isActive && 'opacity-40')} />
      </button>
    </th>
  );
}

function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function formatDate(value?: string | Date) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TypeBadge({ customer }: { customer: Customer }) {
  const isReturning = customer.repeat_customer === 'returning';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        isReturning
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
          : 'bg-gray-100 text-gray-600'
      )}
    >
      {isReturning ? 'Returning' : 'New'}
    </span>
  );
}

export default function CustomerTable({
  customers,
  search,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading,
  isRefreshing,
  pageSize,
}: CustomerTableProps) {
  const router = useRouter();
  const sortProps = { sortBy, sortOrder, onSortChange };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="border-b bg-gray-50/80">
          <tr>
            <SortHeader label="Customer" field="name" {...sortProps} />
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Type
            </th>
            <SortHeader label="Orders" field="total_purchase_count" align="right" {...sortProps} />
            <SortHeader label="Total spent" field="total_amount_spent" align="right" {...sortProps} />
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Avg order
            </th>
            <SortHeader label="Last order" field="last_order_date" align="right" {...sortProps} />
          </tr>
        </thead>
        <tbody
          className={cn(
            'divide-y transition-opacity',
            isRefreshing && 'opacity-60'
          )}
        >
          {isLoading ? (
            Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </td>
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="px-6 py-4">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                ))}
              </tr>
            ))
          ) : customers.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-900">
                  No customers found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search.trim()
                    ? 'Try a different name, phone number or email.'
                    : 'Try a different filter.'}
                </p>
              </td>
            </tr>
          ) : (
            customers.map((c) => {
              const orders = c.total_purchase_count ?? 0;
              const spent = c.total_amount_spent ?? 0;

              return (
                <tr
                  key={c.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/customers/${c.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        {initials(c.name || '')}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {c.name || 'Unnamed customer'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.phone_number}
                          {c.email ? ` · ${c.email}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge customer={c} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {orders}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {orders === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(spent)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {orders > 0 ? formatCurrency(spent / orders) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {formatDate(c.last_order_date)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
