'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Banknote, Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/components/forms/FormDialog';
import { CodOrder, CodStatus, getCodOrders, markCodCollected } from '@/lib/api/order';
import { getSheetSync } from '@/lib/api/marketplaces';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone } from '@/lib/utils/phone';
import { cn } from '@/lib/utils';

const TABS: { id: CodStatus; label: string; hint: string }[] = [
  { id: 'out', label: 'Out', hint: 'Light-blue rows. The COD order is out.' },
  { id: 'pending', label: 'Pending payment', hint: 'Red rows. The COD payment has not come in.' },
  { id: 'collected', label: 'Collected', hint: 'Marked collected here. The sheet colour no longer changes them.' },
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+08:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CodPage() {
  const [status, setStatus] = useState<CodStatus>('pending');
  const [marking, setMarking] = useState<string | null>(null);
  const { data, isLoading, mutate } = useSWR(['cod', status], () => getCodOrders(status));
  const { data: sheet } = useSWR('sheet-sync-issues', getSheetSync);
  const unmatched = (sheet?.issues ?? []).filter((issue) => issue.platform === 'cod');

  const collect = async (order: CodOrder) => {
    setMarking(order.id);
    try {
      await markCodCollected(order.id);
      toast.success(`${order.order_number} marked collected`);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err, 'Couldn’t update this order. Please try again.'));
    } finally {
      setMarking(null);
    }
  };

  const tab = TABS.find((item) => item.id === status)!;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="COD"
          description="WhatsApp orders coloured light blue or red on the order sheet."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={cn(
                'rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-gray-300',
                status === item.id && 'border-[#662d91] ring-1 ring-[#662d91]'
              )}
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {data?.counts ? data.counts[item.id].toLocaleString() : '—'}
              </p>
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">{tab.label}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{tab.hint}</p>
          </div>
          {isLoading ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">Loading…</p>
          ) : !data?.orders.length ? (
            <div className="px-5 py-14 text-center">
              <Banknote className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm font-medium">Nothing in {tab.label.toLowerCase()}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The sheet is read every 15 minutes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Customer</th>
                    <th className="px-3 py-2.5 font-medium">Order</th>
                    <th className="px-3 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Items</th>
                    <th className="px-3 py-2.5 text-right font-medium">Total</th>
                    <th className="px-5 py-2.5 text-right font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium">{order.customers?.name || 'Unnamed customer'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPhone(order.customers?.phone_number)}
                          {order.agent_name ? ` · ${order.agent_name}` : ''}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/orders/${order.id}`} className="font-mono text-xs hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(order.order_date)}</td>
                      <td className="px-3 py-3 font-mono text-xs">{order.shipment_description || '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(order.total_amount)}</td>
                      <td className="px-5 py-3 text-right">
                        {status !== 'collected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={marking === order.id}
                            onClick={() => collect(order)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {marking === order.id ? 'Saving…' : 'Mark collected'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {unmatched.length > 0 && (
          <section className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">On the sheet, not in the CRM</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                These coloured rows didn’t match a WhatsApp order by phone, date and total.
              </p>
            </div>
            <ul className="divide-y text-sm">
              {unmatched.map((issue) => (
                <li key={`${issue.tab}-${issue.row_number}`} className="flex justify-between gap-4 px-5 py-3">
                  <span>{issue.buyer_name || 'No name'}</span>
                  <span className="text-muted-foreground">
                    {issue.tab} · row {issue.row_number}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
