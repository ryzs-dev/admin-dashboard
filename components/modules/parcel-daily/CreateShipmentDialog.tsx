'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { UUID } from 'crypto';
import {
  AlertCircle,
  Banknote,
  Loader2,
  MapPin,
  Package2,
  Store,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone, phoneCountryCode } from '@/lib/utils/phone';
import { createParcelDailyShipment, getCourierQuotes } from '@/lib/api/parcel-daily';
import { Order } from '../order/types';
import { BOOKABLE_COURIERS, courierInfo } from './couriers';
import { CourierOption, CourierPicker } from './CourierPicker';
import { ShipmentInput } from './types';

const DEFAULT_CONTENT = 'Feminine Products';
const PARCEL_WEIGHT_KG = 0.5;

interface CreateShipmentDialogProps {
  order: Order;
  contentValue: number;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

type DeliveryType = 'pickup' | 'dropoff';

const DELIVERY_OPTIONS: {
  value: DeliveryType;
  label: string;
  hint: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'pickup',
    label: 'Pickup',
    hint: 'Courier collects from you',
    icon: Truck,
  },
  {
    value: 'dropoff',
    label: 'Drop-off',
    hint: 'You bring it to a counter',
    icon: Store,
  },
];

type ShipmentErrorBody = {
  message?: string;
  error?: string;
  details?: { message?: string; error?: string; details?: { message?: string } };
};

function errorMessage(err: unknown): string {
  const data = (err as { response?: { data?: ShipmentErrorBody } })?.response
    ?.data;
  return (
    data?.details?.details?.message ||
    data?.details?.message ||
    data?.details?.error ||
    data?.message ||
    data?.error ||
    'Couldn’t create the shipment. Please try again.'
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </h3>
  );
}

export default function CreateShipmentDialog({
  order,
  contentValue,
  isOpen,
  onOpenChange,
}: CreateShipmentDialogProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const isSingapore = order.addresses?.country === 'Singapore';
  const country = isSingapore ? 'Singapore' : 'Malaysia';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courier, setCourier] = useState<string | undefined>();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [codEnabled, setCodEnabled] = useState(false);
  const [codAmount, setCodAmount] = useState(String(contentValue ?? ''));

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCourier(undefined);
    setDeliveryType('pickup');
    setCodEnabled(false);
    setCodAmount(String(contentValue ?? ''));
  }, [isOpen, contentValue]);

  const customer = order.customers;
  const address = order.addresses;
  const content = order.shipment_description?.trim() || DEFAULT_CONTENT;
  const cod = Number(codAmount);

  const postcode = (address?.postcode ?? '').replace(/\D/g, '');
  const postcodeValid = postcode.length === (isSingapore ? 6 : 5);
  const targetCod = codEnabled && cod > 0 ? cod : 0;
  const [quoteCod, setQuoteCod] = useState(0);
  useEffect(() => {
    const handle = setTimeout(() => setQuoteCod(targetCod), 500);
    return () => clearTimeout(handle);
  }, [targetCod]);

  const {
    data: quote,
    error: quoteError,
    isLoading: quoteLoading,
    isValidating: quoteRefreshing,
    mutate: retryQuote,
  } = useSWR(
    isOpen && postcodeValid ? ['courier-quote', postcode, country, quoteCod] : null,
    () => getCourierQuotes({ postcode, country, weight: PARCEL_WEIGHT_KG, cod: quoteCod }),
    { keepPreviousData: true, revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const couriers: CourierOption[] = useMemo(() => {
    if (quote?.couriers.length) {
      return quote.couriers.map((q, index) => ({
        ...courierInfo(q.code, q.name),
        price: q.price,
        detail: q.codFee ? `Incl. ${formatCurrency(q.codFee)} COD fee` : undefined,
        badge: index === 0 ? 'Cheapest' : undefined,
      }));
    }
    return quoteError ? BOOKABLE_COURIERS[country] : [];
  }, [quote, quoteError, country]);

  useEffect(() => {
    if (!couriers.length || couriers.some((c) => c.code === courier)) return;
    setCourier((couriers.find((c) => c.code === 'spx') ?? couriers[0]).code);
  }, [couriers, courier]);

  const selectedCourier = couriers.find((c) => c.code === courier);

  const missing = useMemo(() => {
    const items: string[] = [];
    if (!customer?.phone_number) items.push('phone number');
    if (!address?.full_address?.trim()) items.push('delivery address');
    if (!address?.postcode?.trim()) items.push('postcode');
    return items;
  }, [customer?.phone_number, address?.full_address, address?.postcode]);

  const codInvalid = codEnabled && !(cod > 0);
  const pricesStale = quoteCod !== targetCod || quoteRefreshing;
  const canSubmit = !isLoading && !missing.length && !codInvalid && !pricesStale && !!courier;

  const handleCreateShipment = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);

    const payload: ShipmentInput = {
      serviceProvider: courier as string,
      clientAddress: {
        fullName: customer?.name || '',
        countryCode: phoneCountryCode(customer?.phone_number),
        phone: customer?.phone_number || '',
        email: customer?.email || '',
        line1: address?.full_address || '',
        line2: '',
        city: address?.city || '',
        postcode: address?.postcode || '',
        state: address?.state || '',
        country,
      },
      kg: PARCEL_WEIGHT_KG,
      price: 0,
      cod: codEnabled ? cod : undefined,
      content,
      content_value: contentValue,
      isDropoff: deliveryType === 'dropoff',
    };

    try {
      await createParcelDailyShipment(payload, order.id as UUID);
      toast.success(`Shipment created with ${selectedCourier?.label ?? 'courier'}`);
      onOpenChange?.(false);
      mutate(['order-tracking', order.id]);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const summary = [
    selectedCourier?.label,
    selectedCourier?.price !== undefined ? formatCurrency(selectedCourier.price) : null,
    deliveryType === 'pickup' ? 'Pickup' : 'Drop-off',
    codEnabled && cod > 0 ? `COD ${formatCurrency(cod)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onOpenChange?.(open)}>
      <DialogContent
        aria-describedby="create-shipment-description"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
      >
        <div className="border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Create shipment
          </DialogTitle>
          <DialogDescription id="create-shipment-description" className="mt-1">
            <span className="font-mono">{order.order_number}</span>
            {customer?.name ? ` · to ${customer.name}` : ''}
          </DialogDescription>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <SectionTitle icon={MapPin}>Ship to</SectionTitle>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{customer?.name || 'Unknown customer'}</p>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide',
                    isSingapore
                      ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {isSingapore ? 'Singapore' : 'Malaysia'}
                </span>
              </div>
              <p className="mt-0.5 text-muted-foreground">
                {formatPhone(customer?.phone_number) || 'No phone number'}
              </p>
              <p className="mt-3 leading-relaxed">
                {address?.full_address || (
                  <span className="text-muted-foreground">No address</span>
                )}
              </p>
              {(address?.postcode || address?.city || address?.state) && (
                <p className="text-muted-foreground">
                  {[address?.postcode, address?.city, address?.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>

            {missing.length > 0 && (
              <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Missing {missing.join(', ')}. Update the order before creating
                  a shipment.
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Courier
              </h3>
              {quote && couriers.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {quoteRefreshing && <Loader2 className="h-3 w-3 animate-spin" />}
                  Live Parcel Daily prices to {quote.destination.state || country}
                </span>
              )}
            </div>

            {!postcodeValid ? (
              <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Add a valid postcode to see which couriers deliver there.
              </p>
            ) : quoteLoading && !quote ? (
              <div className="divide-y overflow-hidden rounded-lg border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex h-[53px] items-center gap-3 px-3">
                    <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
                    <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
                    <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-14 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : quote && quote.couriers.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Parcel Daily has no courier for postcode {postcode}. Check the address.
              </p>
            ) : (
              <>
                {quoteError && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <span>Couldn’t load live prices. Parcel Daily will price the courier you pick.</span>
                    <button
                      type="button"
                      onClick={() => retryQuote()}
                      className="shrink-0 font-medium underline-offset-2 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CourierPicker
                  couriers={couriers}
                  value={courier}
                  onChange={setCourier}
                  disabled={isLoading}
                  formatPrice={formatCurrency}
                  layout="list"
                />
              </>
            )}

            <div
              role="radiogroup"
              aria-label="Handover"
              className="mt-3 grid grid-cols-2 gap-2"
            >
              {DELIVERY_OPTIONS.map((option) => {
                const active = option.value === deliveryType;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isLoading}
                    onClick={() => setDeliveryType(option.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:border-gray-300 hover:bg-muted/40'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle icon={Package2}>Parcel</SectionTitle>
            <dl className="divide-y rounded-lg border text-sm">
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-muted-foreground">Contents</dt>
                <dd className="truncate font-mono text-[13px]">{content}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-muted-foreground">Declared value</dt>
                <dd className="tabular-nums">{formatCurrency(contentValue)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-muted-foreground">Weight</dt>
                <dd className="tabular-nums">{PARCEL_WEIGHT_KG} kg</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <label htmlFor="cod-toggle" className="flex cursor-pointer gap-3">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block text-sm font-semibold">
                    Cash on delivery
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    The courier collects payment from the customer.
                  </span>
                </span>
              </label>
              <Switch
                id="cod-toggle"
                checked={codEnabled}
                onCheckedChange={setCodEnabled}
                disabled={isLoading}
              />
            </div>

            {codEnabled && (
              <div className="mt-4 pl-7">
                <label
                  htmlFor="cod-amount"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Amount to collect
                </label>
                <div className="relative max-w-[200px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    RM
                  </span>
                  <Input
                    id="cod-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    className={cn('pl-10 tabular-nums', codInvalid && 'border-red-300')}
                    disabled={isLoading}
                  />
                </div>
                {codInvalid && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Enter an amount above RM 0.
                  </p>
                )}
              </div>
            )}
          </section>

          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate text-sm text-muted-foreground">{summary}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateShipment} disabled={!canSubmit} className="min-w-36">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create shipment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
