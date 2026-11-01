'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone } from '@/lib/utils/phone';
import { AutopilotStep, RunItem } from '@/types/autopilot';
import { ITEM_STATES, TONE_CLASSES } from './labels';

const TH = 'px-3 py-2 text-xs font-medium text-muted-foreground';

export function StatePill({ item }: { item: Pick<RunItem, 'state'> }) {
  const state = ITEM_STATES[item.state];
  return (
    <span
      className={cn(
        'inline-flex flex-none whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[state.tone]
      )}
    >
      {state.label}
    </span>
  );
}

export function RunItemsTable({
  step,
  items,
  onHold,
  busyOrderId,
}: {
  step: AutopilotStep;
  items: RunItem[];
  // Shown only while a batch is waiting: hold or release an order.
  onHold?: (item: RunItem, hold: boolean) => void;
  busyOrderId?: string | null;
}) {
  if (!items.length) {
    return <p className="px-5 py-6 text-sm text-muted-foreground">No orders in this batch.</p>;
  }

  return (
    <div className="relative overflow-x-auto px-2 pb-2">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b">
            <th className={cn(TH, 'text-left')}>Order</th>
            <th className={cn(TH, 'text-left')}>Customer</th>
            <th className={cn(TH, 'text-right')}>{step === 'ship' ? 'Amount' : 'Tracking'}</th>
            <th className={cn(TH, 'text-left')}>Status</th>
            <th className={cn(TH, 'text-left')}>Note</th>
            {onHold && (
              <th className="w-24">
                <span className="sr-only">Hold</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.order_tracking_id ?? item.order_id} className="border-b last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5">
                <Link href={`/orders/${item.order_id}`} className="font-medium text-foreground hover:underline">
                  {item.order_number ?? '—'}
                </Link>
              </td>
              <td className="px-3 py-2.5">
                <p className="truncate">{item.customer_name || '—'}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{formatPhone(item.phone) || '—'}</p>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                {step === 'ship' ? (
                  formatCurrency(item.amount ?? 0)
                ) : (
                  <>
                    <p>{item.tracking_number ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{item.courier ?? ''}</p>
                  </>
                )}
              </td>
              <td className="px-3 py-2.5">
                <StatePill item={item} />
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.reason ?? ''}</td>
              {onHold && (
                <td className="px-3 py-2.5 text-right">
                  {(item.state === 'ready' || item.state === 'on_hold') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={busyOrderId === item.order_id}
                      onClick={() => onHold(item, item.state === 'ready')}
                    >
                      {busyOrderId === item.order_id && <Loader2 className="h-3 w-3 animate-spin" />}
                      {item.state === 'ready' ? 'Hold' : 'Release'}
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
