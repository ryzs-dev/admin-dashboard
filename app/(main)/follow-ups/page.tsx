'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { getFollowUps } from '@/lib/api/customer';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone } from '@/lib/utils/phone';
import { cn } from '@/lib/utils';

const WINDOWS = [30, 45, 60, 90];
const PAGE_SIZE = 50;

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}/.test(value)
    ? new Date(`${value.slice(0, 10)}T00:00:00+08:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FollowUpsPage() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const { data, isLoading } = useSWR(['follow-ups', days, page], () =>
    getFollowUps(days, page * PAGE_SIZE, PAGE_SIZE)
  );
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Follow-ups"
          description="Customers whose last order was long enough ago that they may be ready to buy again."
        >
          <div className="flex rounded-lg border bg-card p-0.5">
            {WINDOWS.map((window) => (
              <button
                key={window}
                type="button"
                onClick={() => {
                  setDays(window);
                  setPage(0);
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm',
                  days === window ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {window} days
              </button>
            ))}
          </div>
        </PageHeader>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-baseline justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Quiet since {days} days</h2>
            <span className="text-sm text-muted-foreground">{total.toLocaleString()} customers</span>
          </div>
          {isLoading ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">Loading…</p>
          ) : !data?.customers.length ? (
            <div className="px-5 py-14 text-center">
              <Clock className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm font-medium">No one has gone this long without ordering</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Customer</th>
                    <th className="px-3 py-2.5 font-medium">Last order</th>
                    <th className="px-3 py-2.5 font-medium">Quiet for</th>
                    <th className="px-3 py-2.5 font-medium">Last items</th>
                    <th className="px-5 py-2.5 text-right font-medium">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                          {customer.name || 'Unnamed customer'}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatPhone(customer.phone_number)}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {customer.last_order_id ? (
                          <Link href={`/orders/${customer.last_order_id}`} className="hover:underline">
                            {formatDate(customer.last_order_date)}
                          </Link>
                        ) : (
                          formatDate(customer.last_order_date)
                        )}
                        <p className="text-xs text-muted-foreground">
                          {customer.total_purchase_count}{' '}
                          {customer.total_purchase_count === 1 ? 'order' : 'orders'}
                        </p>
                      </td>
                      <td className="px-3 py-3 tabular-nums whitespace-nowrap">
                        {customer.days_since ?? '—'} days
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{customer.last_items || '—'}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatCurrency(Number(customer.total_amount_spent || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {pages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= pages}
                  onClick={() => setPage((n) => n + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
