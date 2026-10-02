'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { Loader2, MapPin, Package, Plus, Search, Trash2, User, UserPlus } from 'lucide-react';
import { UUID } from 'crypto';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDialog, FormSection, errorMessage } from '@/components/forms/FormDialog';
import { Field, MoneyInput, QuantityStepper, ChoiceField } from '@/components/forms/Field';
import { getCustomerById, getCustomers } from '@/lib/api/customer';
import { createAddress } from '@/lib/api/address';
import {
  AddressDraft,
  AddressFields,
  addressDraft,
  addressErrors,
  addressPayload,
} from '@/components/forms/AddressFields';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone } from '@/lib/utils/phone';
import { cn } from '@/lib/utils';
import { OrderInput, OrderItemsInput } from '@/types/order';
import { Customer } from '../customer/types';
import { Product } from '../products/types';
import { Order } from './types';
import NewCustomerInline from './NewCustomerInline';

type OrderFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderInput) => void | Promise<void>;
  initialData?: Order;
  customers?: Customer[];
  products: Product[];
  trigger?: React.ReactNode;
  isSubmitting?: boolean;
};

type Line = { product: Product; quantity: number };
type PaymentStatus = 'unpaid' | 'paid';

const PAYMENT_SUGGESTIONS = ['Bank transfer', 'COD', 'Cash', 'Card'];

const todayInMalaysia = () =>
  new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

const round2 = (n: number) => Math.round(n * 100) / 100;

function CustomerPicker({
  value,
  onChange,
  disabled,
}: {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const { data, isLoading } = useSWR(
    open ? ['order-form-customers', debounced] : null,
    () =>
      getCustomers({
        search: debounced || undefined,
        limit: 8,
        sortBy: 'last_order_date',
        sortOrder: 'desc',
      }),
    { keepPreviousData: true, revalidateOnFocus: false }
  );
  const results = data?.data ?? [];

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name || 'Unnamed customer'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatPhone(value.phone_number)}
            {value.total_purchase_count
              ? ` · ${value.total_purchase_count} previous ${value.total_purchase_count === 1 ? 'order' : 'orders'}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  if (creating) {
    return (
      <NewCustomerInline
        initialQuery={query}
        onCancel={() => setCreating(false)}
        onCreated={(customer) => {
          onChange(customer);
          setCreating(false);
          setQuery('');
        }}
      />
    );
  }

  const startCreating = () => {
    setOpen(false);
    setCreating(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="order-customer"
            value={query}
            disabled={disabled}
            autoComplete="off"
            placeholder="Search by name, phone or email"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            className="pl-9"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement)?.id === 'order-customer') e.preventDefault();
        }}
      >
        {isLoading && !results.length ? (
          <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </p>
        ) : results.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            No existing customers match “{debounced}”.
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto">
            {results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(customer);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {customer.name || 'Unnamed customer'}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatPhone(customer.phone_number)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {customer.total_purchase_count ?? 0}{' '}
                    {customer.total_purchase_count === 1 ? 'order' : 'orders'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 border-t pt-1">
          <button
            type="button"
            onClick={startCreating}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/5"
          >
            <UserPlus className="h-4 w-4" />
            {query.trim() ? `Add “${query.trim()}” as a new customer` : 'Add a new customer'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type SavedAddress = {
  id: UUID;
  full_address: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
};

function useSavedAddresses(customerId?: UUID) {
  const { data, isLoading } = useSWR(
    customerId ? ['order-form-addresses', customerId] : null,
    () => getCustomerById(customerId as UUID),
    { revalidateOnFocus: false }
  );
  const addresses = useMemo(() => {
    const seen = new Set<string>();
    return ((data?.data?.addresses ?? []) as SavedAddress[]).filter((address) => {
      if (!address.full_address?.trim()) return false;
      const key = `${address.full_address} ${address.postcode ?? ''}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data]);
  return { addresses, isLoading: !!customerId && isLoading };
}

function ShippingAddressPicker({
  addresses,
  isLoading,
  choice,
  onChoiceChange,
  draft,
  onDraftChange,
  showErrors,
  disabled,
}: {
  addresses: SavedAddress[];
  isLoading: boolean;
  choice: UUID | 'new';
  onChoiceChange: (choice: UUID | 'new') => void;
  draft: AddressDraft;
  onDraftChange: (draft: AddressDraft) => void;
  showErrors: boolean;
  disabled?: boolean;
}) {
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading saved addresses…
      </p>
    );
  }

  const fields = (
    <div className="rounded-lg border bg-muted/30 p-4">
      <AddressFields
        idPrefix="order-address"
        value={draft}
        onChange={onDraftChange}
        showErrors={showErrors}
        disabled={disabled}
      />
    </div>
  );

  if (!addresses.length) return fields;

  const option = (value: UUID | 'new', content: React.ReactNode) => (
    <label
      key={value}
      className={cn(
        'flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors',
        choice === value ? 'bg-primary/5' : 'hover:bg-muted/40'
      )}
    >
      <input
        type="radio"
        name="order-address"
        className="mt-1 accent-[#662d91]"
        checked={choice === value}
        onChange={() => onChoiceChange(value)}
        disabled={disabled}
      />
      <span className="min-w-0 flex-1">{content}</span>
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="divide-y overflow-hidden rounded-lg border">
        {addresses.slice(0, 4).map((address, index) =>
          option(
            address.id,
            <>
              <span className="block leading-snug">{address.full_address}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {[address.postcode, address.city, address.state, address.country]
                  .filter(Boolean)
                  .join(', ')}
                {index === 0 && ' · Latest'}
              </span>
            </>
          )
        )}
        {option('new', <span className="font-medium text-primary">Use a different address</span>)}
      </div>
      {choice === 'new' && fields}
    </div>
  );
}

export default function OrderFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  products,
  trigger,
  isSubmitting = false,
}: OrderFormDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderDate, setOrderDate] = useState(todayInMalaysia());
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState('');
  const [totalTouched, setTotalTouched] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [addressChoice, setAddressChoice] = useState<UUID | 'new'>('new');
  const [addressDraftValue, setAddressDraftValue] = useState<AddressDraft>(addressDraft());
  const [showAddressErrors, setShowAddressErrors] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const { addresses, isLoading: addressesLoading } = useSavedAddresses(customer?.id);
  const createdAddress = useRef<{ key: string; id: UUID } | null>(null);
  const busy = isSubmitting || savingAddress;

  useEffect(() => {
    setAddressChoice(addresses[0]?.id ?? 'new');
    setAddressDraftValue(addressDraft());
    setShowAddressErrors(false);
  }, [customer?.id, addresses]);

  useEffect(() => {
    if (!isOpen) return;
    setCustomer((initialData?.customers as Customer | undefined) ?? null);
    setOrderDate(initialData?.order_date?.slice(0, 10) ?? todayInMalaysia());
    setLines(
      (initialData?.order_items ?? []).map((item) => ({
        product: item.products as Product,
        quantity: item.quantity,
      }))
    );
    setTotal(initialData ? String(initialData.total_amount ?? '') : '');
    setTotalTouched(!!initialData);
    setStatus(initialData?.status === 'paid' ? 'paid' : 'unpaid');
    setPaymentMethod(initialData?.payment_method ?? '');
    setError(null);
    createdAddress.current = null;
  }, [isOpen, initialData]);

  const itemsKey = (list: { product_id: string; quantity: number }[]) =>
    list
      .map((item) => `${item.product_id}:${item.quantity}`)
      .sort()
      .join(',');
  const descriptionChanged =
    !!initialData &&
    itemsKey(lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity }))) !==
      itemsKey(
        (initialData.order_items ?? []).map((i) => ({
          product_id: String(i.product_id),
          quantity: i.quantity,
        }))
      );
  const shipmentDescription =
    initialData && !descriptionChanged
      ? (initialData.shipment_description ?? '')
      : lines
          .map((line) => (line.product.code ? `${line.quantity}${line.product.code.trim()}` : ''))
          .join('');
  const tracking = initialData?.order_tracking as
    | Order['order_tracking']
    | Order['order_tracking'][]
    | undefined;
  const bookedTracking = Array.isArray(tracking) ? tracking[0] : tracking;

  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.product.price ?? 0) * line.quantity,
    0
  );

  const updateLines = (next: Line[]) => {
    setLines(next);
    if (!totalTouched) {
      const nextSubtotal = next.reduce(
        (sum, line) => sum + Number(line.product.price ?? 0) * line.quantity,
        0
      );
      setTotal(nextSubtotal ? String(round2(nextSubtotal)) : '');
    }
  };

  const available = useMemo(() => {
    const used = new Set(lines.map((line) => line.product.id));
    const unique = new Map<string, Product>();
    for (const product of products ?? []) {
      if (!used.has(product.id) && !unique.has(product.id)) unique.set(product.id, product);
    }
    return [...unique.values()];
  }, [products, lines]);

  const totalNumber = Number(total);
  const totalInvalid = total.trim() !== '' && !(totalNumber > 0);
  const canSubmit = !!customer && lines.length > 0 && totalNumber > 0;
  const missingHint = !customer
    ? 'Choose a customer'
    : !lines.length
      ? 'Add at least one product'
      : !(totalNumber > 0)
        ? 'Enter the order total'
        : `${lines.length} ${lines.length === 1 ? 'product' : 'products'} · ${formatCurrency(totalNumber)}`;

  const handleSubmit = async () => {
    if (!customer) return;
    const newAddress = addressChoice === 'new';
    if (newAddress && Object.values(addressErrors(addressDraftValue)).some(Boolean)) {
      setShowAddressErrors(true);
      return;
    }
    setError(null);
    try {
      let addressId = newAddress ? undefined : addressChoice;
      if (newAddress) {
        const payload = { ...addressPayload(addressDraftValue), customer_id: customer.id };
        const key = JSON.stringify(payload);
        // Reuse the address saved by a previous attempt so retries don't duplicate it.
        if (createdAddress.current?.key === key) {
          addressId = createdAddress.current.id;
        } else {
          setSavingAddress(true);
          try {
            const created = await createAddress(payload);
            addressId = created.address.id;
            createdAddress.current = { key, id: created.address.id };
          } finally {
            setSavingAddress(false);
          }
        }
      }
      await onSubmit({
        customer_id: customer.id,
        address_id: addressId,
        order_date: new Date(orderDate),
        order_items: lines.map((line) => ({
          product_id: line.product.id as UUID,
          quantity: line.quantity,
        })) as OrderItemsInput[],
        total_amount: round2(totalNumber),
        status,
        payment_method: paymentMethod.trim(),
      });
    } catch (err) {
      setError(errorMessage(err, initialData ? 'Couldn’t save the order. Please try again.' : 'Couldn’t create the order. Please try again.'));
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      trigger={trigger}
      title={initialData ? 'Edit order' : 'New order'}
      description="For orders that didn’t come through the WhatsApp bot."
      size="lg"
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save order' : 'Create order'}
      submittingLabel={initialData ? 'Saving…' : 'Creating…'}
      isSubmitting={busy}
      submitDisabled={!canSubmit || addressesLoading}
      error={error}
      footerNote={missingHint}
    >
      <FormSection title="Customer" icon={User}>
        <CustomerPicker value={customer} onChange={setCustomer} disabled={busy} />
      </FormSection>

      {customer && (
        <FormSection title="Shipping address" icon={MapPin}>
          <ShippingAddressPicker
            addresses={addresses}
            isLoading={addressesLoading}
            choice={addressChoice}
            onChoiceChange={setAddressChoice}
            draft={addressDraftValue}
            onDraftChange={setAddressDraftValue}
            showErrors={showAddressErrors}
            disabled={busy}
          />
        </FormSection>
      )}

      <FormSection title="Products" icon={Package}>
        {lines.length > 0 && (
          <div className="mb-2 divide-y rounded-lg border">
            {lines.map((line, index) => (
              <div key={line.product.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(line.product.price ?? 0))} each
                  </p>
                </div>
                <QuantityStepper
                  label={line.product.name}
                  value={line.quantity}
                  disabled={busy}
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
                  disabled={busy}
                  onClick={() => updateLines(lines.filter((_, i) => i !== index))}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <Select
            value=""
            disabled={busy}
            onValueChange={(id) => {
              const product = available.find((p) => p.id === id);
              if (product) updateLines([...lines, { product, quantity: 1 }]);
            }}
          >
            <SelectTrigger className="w-full border-dashed text-muted-foreground">
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

        {lines.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Parcel description</span>
              <span className="font-mono text-xs">{shipmentDescription || '—'}</span>
            </div>
            {bookedTracking && descriptionChanged && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                A parcel is already booked for this order
                {bookedTracking.tracking_number ? ` (${bookedTracking.tracking_number})` : ''}. Its
                label keeps “{initialData?.shipment_description}” because Parcel Daily can’t edit a
                booked parcel.
              </p>
            )}
          </div>
        )}
      </FormSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Order total"
          htmlFor="order-total"
          error={totalInvalid ? 'Enter an amount above RM 0.' : undefined}
          hint={
            subtotal > 0
              ? totalTouched && round2(totalNumber) !== round2(subtotal)
                ? `List price is ${formatCurrency(subtotal)}`
                : 'Filled in from list prices. Change it for bundle deals.'
              : undefined
          }
        >
          <MoneyInput
            id="order-total"
            value={total}
            invalid={totalInvalid}
            disabled={busy}
            onChange={(value) => {
              setTotal(value);
              setTotalTouched(true);
            }}
          />
        </Field>
        <Field label="Order date" htmlFor="order-date">
          <Input
            id="order-date"
            type="date"
            value={orderDate}
            max={todayInMalaysia()}
            onChange={(e) => setOrderDate(e.target.value)}
            disabled={busy}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment">
          <ChoiceField
            label="Payment"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'paid', label: 'Paid' },
            ]}
            disabled={busy}
          />
        </Field>
        <Field label="Payment method" htmlFor="payment-method" optional>
          <Input
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="e.g. Bank transfer"
            disabled={busy}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PAYMENT_SUGGESTIONS.map((method) => (
              <button
                key={method}
                type="button"
                disabled={busy}
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  paymentMethod === method
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:border-gray-300 hover:text-foreground'
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </FormDialog>
  );
}
