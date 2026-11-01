'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { FileText, Loader2, Receipt as ReceiptIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderReceipts, recheckReceipt } from '@/lib/api/receipts';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDateTime } from '@/lib/utils/date';
import { Receipt } from '@/types/receipt';
import { ReceiptStatus } from './ReceiptStatus';

export function ReceiptPreview({ receipt }: { receipt: Receipt }) {
  if (!receipt.url) return null;
  return receipt.mime_type === 'application/pdf' ? (
    <a
      href={receipt.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-3 text-sm font-medium hover:bg-muted"
    >
      <FileText className="h-4 w-4 text-muted-foreground" />
      Open receipt (PDF)
    </a>
  ) : (
    <a href={receipt.url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
      <img
        src={receipt.url}
        alt="Payment receipt"
        className="max-h-72 w-full rounded-lg border bg-muted/40 object-contain"
      />
    </a>
  );
}

function ReceiptFacts({ receipt }: { receipt: Receipt }) {
  const facts: [string, string | null][] = [
    ['Amount', receipt.amount === null ? null : formatCurrency(Number(receipt.amount))],
    ['Paid on', receipt.paid_on],
    ['Reference', receipt.reference],
    ['Bank', receipt.bank],
    ['Payer', receipt.payer],
  ];
  const shown = facts.filter(([, value]) => value);
  if (!shown.length) return null;
  return (
    <dl className="space-y-1.5 text-sm">
      {shown.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="truncate text-right font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReceiptCard({ orderId }: { orderId: string }) {
  const { data, isLoading, mutate } = useSWR(['order-receipts', orderId], () => getOrderReceipts(orderId), {
    // Keep polling while a receipt is still being read.
    refreshInterval: (d) => (d?.receipts.some((r) => r.check_status === 'pending') ? 4000 : 0),
  });
  const [checking, setChecking] = useState<string | null>(null);
  const receipts = data?.receipts ?? [];

  const recheck = async (id: string) => {
    setChecking(id);
    try {
      await recheckReceipt(id);
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t check the receipt');
    } finally {
      setChecking(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          Payment receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No receipt yet. Staff can send the receipt photo to the WhatsApp bot with the order typed as its
            caption, or on its own right after the order.
          </p>
        ) : (
          receipts.map((receipt) => (
            <div key={receipt.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ReceiptStatus status={receipt.check_status} />
                <span className="text-xs text-muted-foreground">
                  {formatFriendlyDateTime(receipt.received_at)}
                </span>
              </div>
              {receipt.check_note && (
                <p className="text-sm text-muted-foreground">{receipt.check_note}</p>
              )}
              <ReceiptPreview receipt={receipt} />
              <ReceiptFacts receipt={receipt} />
              {data?.reading_enabled && receipt.check_status !== 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-muted-foreground"
                  disabled={checking === receipt.id}
                  onClick={() => recheck(receipt.id)}
                >
                  {checking === receipt.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Check again
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
