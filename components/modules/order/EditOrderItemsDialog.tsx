'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { UUID } from 'crypto';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDialog, FormSection, errorMessage } from '@/components/forms/FormDialog';
import { Field, MoneyInput, QuantityStepper } from '@/components/forms/Field';
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

      <div className="grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-2 sm:items-end">
        <div className="text-sm">
          <p className="text-muted-foreground">Subtotal at list price</p>
          <p className="mt-0.5 text-base font-medium tabular-nums">{formatCurrency(subtotal)}</p>
        </div>
        <Field
          label="Order total"
          htmlFor="order-total"
          error={totalInvalid ? 'Enter the amount the customer paid.' : undefined}
          hint={
            !totalTouched && originalDiscount > 0
              ? `Keeps the ${formatCurrency(originalDiscount)} bundle discount`
              : undefined
          }
        >
          <MoneyInput
            id="order-total"
            value={total}
            invalid={totalInvalid}
            disabled={saving}
            onChange={(value) => {
              setTotal(value);
              setTotalTouched(true);
            }}
          />
        </Field>
      </div>
    </FormDialog>
  );
};

export default EditOrderDialog;
