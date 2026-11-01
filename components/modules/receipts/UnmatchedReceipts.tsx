'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Receipt as ReceiptIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { attachReceipt, getUnmatchedReceipts } from '@/lib/api/receipts';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDateTime } from '@/lib/utils/date';
import { formatPhone } from '@/lib/utils/phone';
import { Receipt } from '@/types/receipt';
import { ReceiptPreview } from './ReceiptCard';

function UnmatchedRow({ receipt, onAttached }: { receipt: Receipt; onAttached: () => void }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const attach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSaving(true);
    try {
      await attachReceipt(receipt.id, orderNumber);
      toast.success(`Receipt attached to ${orderNumber.trim().toUpperCase()}`);
      onAttached();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t attach the receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="space-y-3 border-b px-6 py-5 last:border-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium tabular-nums">
          {receipt.amount === null ? 'Amount not read' : formatCurrency(Number(receipt.amount))}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatFriendlyDateTime(receipt.received_at)}
          {receipt.sender_phone && ` · from ${formatPhone(receipt.sender_phone)}`}
        </span>
      </div>
      {(receipt.payer || receipt.reference) && (
        <p className="text-xs text-muted-foreground">
          {[receipt.payer, receipt.reference && `Ref ${receipt.reference}`].filter(Boolean).join(' · ')}
        </p>
      )}
      <ReceiptPreview receipt={receipt} />
      <form onSubmit={attach} className="flex gap-2">
        <Input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number, e.g. ORD-04319"
          aria-label="Order number to attach this receipt to"
          className="flex-1"
          disabled={saving}
        />
        <Button type="submit" disabled={saving || !orderNumber.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Attach
        </Button>
      </form>
    </li>
  );
}

// Receipts the system couldn't place on an order; staff attach each by order number.
export function UnmatchedReceiptsButton({ onAttached }: { onAttached?: () => void }) {
  const [open, setOpen] = useState(false);
  const { data, mutate } = useSWR('unmatched-receipts', getUnmatchedReceipts, {
    refreshInterval: 60000,
  });
  const receipts = data ?? [];
  if (!receipts.length) return null;

  return (
    <>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <ReceiptIcon className="h-4 w-4" />
        {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'} to match
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="text-lg">Receipts to match</SheetTitle>
            <SheetDescription>
              Sent on WhatsApp without an order the system could link. Type the order number each one pays for.
            </SheetDescription>
          </SheetHeader>
          <ul>
            {receipts.map((receipt) => (
              <UnmatchedRow
                key={receipt.id}
                receipt={receipt}
                onAttached={() => {
                  mutate();
                  onAttached?.();
                }}
              />
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
