'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import { Field, MoneyInput } from '@/components/forms/Field';
import { ProductInput } from '@/types/product';
import { Product } from './types';

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput) => void | Promise<void>;
  initialData?: Product;
  existingProducts?: Product[];
  trigger?: React.ReactNode;
};

// Must match the WhatsApp extractor, which reads "<qty><code>" (e.g. "2w1s")
// from the order's last line using /(\d+)([a-z]+(?:\d+ml)?)/.
const CODE_PATTERN = /^[a-z]+(\d+ml)?$/;

export default function ProductForm({
  onSubmit,
  onClose,
  isOpen,
  initialData,
  existingProducts = [],
  trigger,
}: ProductFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [code, setCode] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name ?? '');
    setPrice(initialData ? String(initialData.price ?? '') : '');
    setCode(initialData?.code ?? '');
    setShowErrors(false);
    setError(null);
  }, [isOpen, initialData]);

  const normalizedCode = code.trim().toLowerCase();
  const errors = {
    name: !name.trim() ? 'Enter a product name.' : undefined,
    price: price.trim() === '' || !(Number(price) >= 0) ? 'Enter a price of RM 0 or more.' : undefined,
    code: !normalizedCode
      ? 'Needed so WhatsApp orders can detect this product.'
      : !CODE_PATTERN.test(normalizedCode)
        ? 'Letters only, optionally ending in a size like 30ml (e.g. w, rose, w30ml).'
        : existingProducts.some(
              (product) =>
                product.id !== initialData?.id &&
                product.code?.toLowerCase() === normalizedCode
            )
          ? 'Another product already uses this code.'
          : undefined,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async () => {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), price: Number(price), code: normalizedCode });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save the product. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      trigger={trigger}
      title={initialData ? 'Edit product' : 'New product'}
      description={
        initialData
          ? 'Update the name, price or WhatsApp code.'
          : 'Add a product so it can be ordered on WhatsApp and in the dashboard.'
      }
      size="sm"
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save product' : 'Add product'}
      isSubmitting={saving}
      error={error}
    >
      <Field label="Name" htmlFor="product-name" error={showErrors ? errors.name : undefined}>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Femlift 30ml"
          disabled={saving}
        />
      </Field>

      <Field label="Price" htmlFor="product-price" error={showErrors ? errors.price : undefined}>
        <MoneyInput
          id="product-price"
          value={price}
          onChange={setPrice}
          invalid={showErrors && !!errors.price}
          disabled={saving}
        />
      </Field>

      <Field
        label="WhatsApp code"
        htmlFor="product-code"
        error={showErrors || (normalizedCode && errors.code) ? errors.code : undefined}
        hint="Staff type the quantity then this code on the last line of a WhatsApp order."
      >
        <Input
          id="product-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. w"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          disabled={saving}
        />
      </Field>

      {normalizedCode && !errors.code && (
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
          <span className="font-mono font-medium">2{normalizedCode}</span>
          <span className="text-muted-foreground"> in a WhatsApp order means </span>
          2 × {name.trim() || 'this product'}
        </div>
      )}
    </FormDialog>
  );
}
