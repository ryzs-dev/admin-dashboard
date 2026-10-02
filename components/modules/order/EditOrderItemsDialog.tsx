'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { UUID } from 'crypto';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDialog, FormSection, errorMessage } from '@/components/forms/FormDialog';
import { MoneyInput, QuantityStepper } from '@/components/forms/Field';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { buildShipmentDescription, giftCodes } from './shipmentDescription';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils/currency';
import { UpdateLineItemsInput } from '@/types/order';
import { Order } from '@/components/modules/order/types';
import { Product } from '@/components/modules/products/types';

interface EditOrderDialogProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOrder: (data: UpdateLineItemsInput) => Promise<void>;
}

type Line = { product: Product; quantity: number };

const listTotal = (lines: Line[]) =>
  lines.reduce((sum, line) => sum + Number(line.product.price ?? 0) * line.quantity, 0);

const round2 = (n: number) => Math.round(n * 100) / 100;

const EditOrderDialog = ({ order, isOpen, onOpenChange, onUpdateOrder }: EditOrderDialogProps) => {
  const { products } = useProducts();
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState('');
  const [totalTouched, setTotalTouched] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalLines = useMemo<Line[]>(
    () =>
      (order.order_items ?? []).map((item) => ({
        product: item.products as Product,
        quantity: item.quantity,
      })),
    [order.order_items]
  );
  // Bundle deals make the paid total lower than the list price; keep that
  // discount when items change so the total doesn't jump to full price.
  const originalDiscount = listTotal(originalLines) - (Number(order.total_amount) || 0);

  useEffect(() => {
    if (!isOpen) return;
    setLines(originalLines);
    setTotal(String(Number(order.total_amount) || 0));
    setTotalTouched(false);
    setDescriptionDraft(null);
    setError(null);
  }, [isOpen, originalLines, order.total_amount]);

  const updateLines = (next: Line[]) => {
    setLines(next);
    if (!totalTouched) {
      setTotal(String(round2(Math.max(0, listTotal(next) - originalDiscount))));
    }
  };

  const available = useMemo(() => {
    const seen = new Set(lines.map((line) => line.product.id));
    const unique = new Map<string, Product>();
    for (const product of (products ?? []) as Product[]) {
      if (!seen.has(product.id) && !unique.has(product.id)) unique.set(product.id, product);
    }
    return [...unique.values()];
  }, [products, lines]);

  const subtotal = listTotal(lines);
  const totalNumber = Number(total);
  const totalInvalid = !(totalNumber >= 0) || total.trim() === '';
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const adjustment = round2(subtotal - totalNumber);

  const productCodes = useMemo(
    () => ((products ?? []) as Product[]).map((p) => p.code ?? '').filter(Boolean),
    [products]
  );
  const itemsKey = (list: Line[]) =>
    list
      .map((line) => `${line.product.id}:${line.quantity}`)
      .sort()
      .join(',');
  const itemsChanged = itemsKey(lines) !== itemsKey(originalLines);
  const storedDescription = order.shipment_description ?? '';
  const shipmentDescription =
    descriptionDraft ??
    (itemsChanged
      ? buildShipmentDescription(lines, storedDescription, productCodes)
      : storedDescription);
  const gifts = giftCodes(shipmentDescription, productCodes);
  const descriptionChanged =
    shipmentDescription.replace(/\s+/g, '') !== storedDescription.replace(/\s+/g, '');
  const tracking = order.order_tracking as
    | Order['order_tracking']
    | Order['order_tracking'][]
    | undefined;
  const bookedParcel = Array.isArray(tracking) ? tracking[0] : tracking;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdateOrder({
        line_items: lines.map((line) => ({
          product_id: line.product.id as UUID,
          quantity: line.quantity,
        })),
        total_amount: round2(totalNumber),
        ...(descriptionDraft !== null && {
          shipment_description: descriptionDraft.replace(/\s+/g, ''),
        }),
      });
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save the order. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Edit items"
      description={<span className="font-mono">{order.order_number}</span>}
      size="lg"
      onSubmit={handleSave}
      submitLabel="Save changes"
      isSubmitting={saving}
      submitDisabled={!lines.length || totalInvalid}
      error={error}
      footerNote={`${lines.length} ${lines.length === 1 ? 'product' : 'products'} · ${units} ${units === 1 ? 'unit' : 'units'}`}
    >
      <FormSection title="Products" icon={Package}>
        <div className="divide-y rounded-lg border">
          {lines.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Add at least one product.
            </p>
          )}
          {lines.map((line, index) => (
            <div key={line.product.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(line.product.price ?? 0))} each
                  {line.product.code && (
                    <span className="ml-1.5 font-mono">· {line.product.code}</span>
                  )}
                </p>
              </div>
              <QuantityStepper
                label={line.product.name}
                value={line.quantity}
                disabled={saving}
                onChange={(quantity) =>
                  updateLines(lines.map((l, i) => (i === index ? { ...l, quantity } : l)))
                }
              />
              <p className="w-20 text-right text-sm tabular-nums">
                {formatCurrency(Number(line.product.price ?? 0) * line.quantity)}
              </p>
              <button
                type="button"
                aria-label={`Remove ${line.product.name}`}
                disabled={saving}
                onClick={() => updateLines(lines.filter((_, i) => i !== index))}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {available.length > 0 && (
          <Select
            value=""
            disabled={saving}
            onValueChange={(id) => {
              const product = available.find((p) => p.id === id);
              if (product) updateLines([...lines, { product, quantity: 1 }]);
            }}
          >
            <SelectTrigger className="mt-2 w-full border-dashed text-muted-foreground">
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <SelectValue placeholder="Add a product" />
              </span>
            </SelectTrigger>
            <SelectContent>
              {available.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                  <span className="ml-2 text-muted-foreground">
                    {formatCurrency(Number(product.price ?? 0))}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormSection>

      <section aria-label="Order summary" className="rounded-xl border">
        <dl className="space-y-2 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              Subtotal
              <span className="ml-1 text-xs">
                ({units} {units === 1 ? 'unit' : 'units'} at list price)
              </span>
            </dt>
            <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
          </div>
          {!totalInvalid && Math.abs(adjustment) >= 0.01 && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                {adjustment > 0 ? 'Bundle discount' : 'Above list price'}
              </dt>
              <dd
                className={cn(
                  'tabular-nums',
                  adjustment > 0 ? 'text-emerald-700' : 'text-amber-700'
                )}
              >
                {adjustment > 0 ? '−' : '+'}
                {formatCurrency(Math.abs(adjustment))}
              </dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 pt-1">
            <dt className="pt-1.5">
              <label htmlFor="shipment-description" className="text-muted-foreground">
                Parcel description
              </label>
              <p className="text-xs text-muted-foreground">
                {gifts.length
                  ? `Includes free ${gifts.length === 1 ? 'gift' : 'gifts'} ${gifts.join(', ')}`
                  : 'Add gift codes here, e.g. 1a'}
              </p>
            </dt>
            <dd className="flex items-center gap-1">
              <Input
                id="shipment-description"
                value={shipmentDescription}
                disabled={saving}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                className="h-8 w-44 text-right font-mono text-xs"
              />
              {descriptionDraft !== null && (
                <button
                  type="button"
                  aria-label="Reset parcel description"
                  title="Rebuild from items"
                  disabled={saving}
                  onClick={() => setDescriptionDraft(null)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3">
          <div>
            <label htmlFor="order-total" className="text-sm font-semibold">
              Order total
            </label>
            <p
              className={cn(
                'text-xs',
                totalInvalid ? 'text-red-600' : 'text-muted-foreground'
              )}
            >
              {totalInvalid
                ? 'Enter the amount the customer paid.'
                : totalTouched
                  ? 'Set manually'
                  : originalDiscount > 0
                    ? 'Keeps the original bundle discount'
                    : 'Follows list prices'}
            </p>
          </div>
          <MoneyInput
            id="order-total"
            value={total}
            invalid={totalInvalid}
            disabled={saving}
            className="w-40 [&_input]:text-right [&_input]:text-base [&_input]:font-semibold"
            onChange={(value) => {
              setTotal(value);
              setTotalTouched(true);
            }}
          />
        </div>
      </section>

      {bookedParcel && descriptionChanged && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          A parcel is already booked for this order
          {bookedParcel.tracking_number ? ` (${bookedParcel.tracking_number})` : ''}. Its label
          keeps “{order.shipment_description}” because Parcel Daily can’t edit a booked parcel.
        </p>
      )}
    </FormDialog>
  );
};

export default EditOrderDialog;
