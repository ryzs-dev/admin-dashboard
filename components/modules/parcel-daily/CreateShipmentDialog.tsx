'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { UUID } from 'crypto';
import {
  AlertCircle,
  Loader2,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { useParcelDailySettings, useParcelDailyVouchers } from '@/hooks/useParcelDaily';
import { VoucherSignInDialog } from '@/components/modules/integrations/parcel-daily/VoucherSignInDialog';
import { formatPhone, phoneCountryCode } from '@/lib/utils/phone';
import { createParcelDailyShipment, getCourierQuotes, ParcelDailyVoucher } from '@/lib/api/parcel-daily';
import { Order } from '../order/types';
import { BOOKABLE_COURIERS, courierInfo } from './couriers';
import { CourierLogo, CourierOption } from './CourierPicker';
import { ShipmentInput } from './types';

const DEFAULT_CONTENT = 'Feminine Products';
const FALLBACK_WEIGHT_KG = 0.5;

interface CreateShipmentDialogProps {
  order: Order;
  contentValue: number;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

type DeliveryType = 'pickup' | 'dropoff';

// C1b layout: label on the left, a borderless dropdown on the right, no lines.
const ROW_TRIGGER =
  'h-auto w-auto max-w-full justify-end gap-2 border-0 bg-transparent px-2 py-1.5 shadow-none hover:bg-muted/60 data-[size=default]:h-auto';

function ListRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center gap-3">
      <label htmlFor={htmlFor} className="w-36 shrink-0 text-sm text-muted-foreground">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 justify-end -mr-2">{children}</div>
    </div>
  );
}

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

// Mirrors the rules Parcel Daily checks at checkout.
const EAST_MALAYSIA: [number, number][] = [
  [86999, 91310],
  [92999, 98860],
];
const inEastMalaysia = (postcode?: string) => {
  const n = Number(postcode);
  return !Number.isNaN(n) && EAST_MALAYSIA.some(([lo, hi]) => n >= lo && n <= hi);
};

function voucherDiscount(
  v: ParcelDailyVoucher,
  s: { courier?: string; price?: number; kg: number; country: string; postcode: string; pickupPostcode?: string }
) {
  if (!v.id || v.left < 1 || !s.courier || s.price === undefined) return 0;
  if (v.couriers.length && !v.couriers.includes(s.courier.toLowerCase())) return 0;
  if (v.maxWeightKg != null && s.kg > v.maxWeightKg) return 0;
  if (v.region) {
    if (v.region !== 'WTW' || s.country !== 'Malaysia') return 0;
    if (inEastMalaysia(s.postcode) || inEastMalaysia(s.pickupPostcode)) return 0;
  }
  if (v.minSpend && s.price < v.minSpend) return 0;
  const raw = v.type === 'percent' ? (s.price * Number(v.percent ?? 0)) / 100 : Number(v.amount ?? 0);
  return Math.round(Math.min(Math.max(raw, 0), s.price) * 100) / 100;
}

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '';

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
  const { settings } = useParcelDailySettings();
  const { session: voucherSession, vouchers } = useParcelDailyVouchers();
  const [voucherChoice, setVoucherChoice] = useState<string | undefined>();
  const [voucherSignIn, setVoucherSignIn] = useState(false);
  const vouchersOff = !!voucherSession && voucherSession.state !== 'signed_in';
  const defaults = settings?.defaults;
  const weightKg = defaults?.kg ?? FALLBACK_WEIGHT_KG;
  const defaultDelivery: DeliveryType = defaults?.isDropoff ? 'dropoff' : 'pickup';
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(defaultDelivery);
  const [codEnabled, setCodEnabled] = useState(false);
  const [codAmount, setCodAmount] = useState(String(contentValue ?? ''));

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCourier(undefined);
    setVoucherChoice(undefined);
    setDeliveryType(defaultDelivery);
    setCodEnabled(false);
    setCodAmount(String(contentValue ?? ''));
  }, [isOpen, contentValue, defaultDelivery]);

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
    isOpen && postcodeValid ? ['courier-quote', postcode, country, quoteCod, weightKg] : null,
    () => getCourierQuotes({ postcode, country, weight: weightKg, cod: quoteCod }),
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
    const preferred = defaults?.courier ?? 'spx';
    setCourier((couriers.find((c) => c.code === preferred) ?? couriers[0]).code);
  }, [couriers, courier, defaults?.courier]);

  const selectedCourier = couriers.find((c) => c.code === courier);

  // Vouchers that fit this courier and parcel, best saving (then earliest expiry) first.
  const fittingVouchers = useMemo(() => {
    if (voucherSession?.state !== 'signed_in') return [];
    return vouchers
      .map((v) => ({
        voucher: v,
        discount: voucherDiscount(v, {
          courier,
          price: selectedCourier?.price,
          kg: weightKg,
          country,
          postcode,
          pickupPostcode: settings?.pickupAddress.postcode,
        }),
      }))
      .filter((f) => f.discount > 0)
      .sort(
        (a, b) =>
          b.discount - a.discount ||
          String(a.voucher.nextExpiry).localeCompare(String(b.voucher.nextExpiry))
      );
  }, [voucherSession?.state, vouchers, courier, selectedCourier?.price, weightKg, country, postcode, settings?.pickupAddress.postcode]);

  // Pre-select the best voucher; keep the staff's pick while it still fits.
  useEffect(() => {
    if (voucherChoice === 'none') return;
    if (fittingVouchers.some((f) => f.voucher.id === voucherChoice)) return;
    setVoucherChoice(fittingVouchers[0]?.voucher.id ?? undefined);
  }, [fittingVouchers, voucherChoice]);

  const chosenVoucher = fittingVouchers.find((f) => f.voucher.id === voucherChoice);

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
      kg: weightKg,
      price: 0,
      cod: codEnabled ? cod : undefined,
      content,
      content_value: contentValue,
      isDropoff: deliveryType === 'dropoff',
      voucherId: chosenVoucher?.voucher.id ?? 'none',
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

  const voucherOff = chosenVoucher?.discount ?? 0;
  const total =
    selectedCourier?.price !== undefined ? Math.max(selectedCourier.price - voucherOff, 0) : undefined;

  // Best voucher saving for a courier (0 when staff picked "No voucher").
  const cardDiscount = (c: CourierOption) => {
    if (voucherChoice === 'none' || voucherSession?.state !== 'signed_in') return 0;
    return Math.max(
      0,
      ...vouchers.map((v) =>
        voucherDiscount(v, {
          courier: c.code,
          price: c.price,
          kg: weightKg,
          country,
          postcode,
          pickupPostcode: settings?.pickupAddress.postcode,
        })
      )
    );
  };

  const initials = (customer?.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onOpenChange?.(open)}>
      <DialogContent
        aria-describedby="create-shipment-description"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
      >
        <div className="px-6 pt-5 pb-4">
          <DialogTitle className="text-lg font-semibold tracking-tight">Create shipment</DialogTitle>
          <DialogDescription id="create-shipment-description" className="mt-0.5 font-mono text-xs">
            {order.order_number}
          </DialogDescription>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          <section className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </span>
            <div className="min-w-0 text-sm">
              <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                {customer?.name || 'Unknown customer'}
                {isSingapore && (
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-700 ring-1 ring-inset ring-sky-600/20">
                    Singapore
                  </span>
                )}
              </p>
              <p className="text-muted-foreground">
                {address?.full_address || 'No address'}
              </p>
              <p className="text-muted-foreground">
                {[
                  [address?.postcode, address?.city].filter(Boolean).join(' '),
                  address?.state,
                ]
                  .filter(Boolean)
                  .join(', ')}
                {customer?.phone_number ? ` · ${formatPhone(customer.phone_number)}` : ''}
              </p>
            </div>
          </section>

          {missing.length > 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Missing {missing.join(', ')}. Update the order before creating a shipment.</p>
            </div>
          )}

          {!postcodeValid ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Add a valid postcode to see which couriers deliver there.
            </p>
          ) : quote && quote.couriers.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Parcel Daily has no courier for postcode {postcode}. Check the address.
            </p>
          ) : (
            quoteError && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span>Couldn’t load live prices. Parcel Daily will price the courier you pick.</span>
                <button
                  type="button"
                  onClick={() => retryQuote()}
                  className="shrink-0 font-medium underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              </div>
            )
          )}

          <section className="flex flex-col">
            <ListRow label="Courier">
              {quoteLoading && !quote ? (
                <span className="h-4 w-40 animate-pulse rounded bg-muted" />
              ) : (
                <Select
                  value={courier ?? ''}
                  onValueChange={setCourier}
                  disabled={isLoading || !couriers.length}
                >
                  <SelectTrigger aria-label="Courier" className={ROW_TRIGGER}>
                    {selectedCourier ? (
                      <span className="flex min-w-0 items-center gap-2.5">
                        <CourierLogo courier={selectedCourier} className="h-6 w-10" />
                        <span className="truncate">{selectedCourier.label}</span>
                        {selectedCourier.price !== undefined && (
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(selectedCourier.price)}
                          </span>
                        )}
                        {quoteRefreshing && <Loader2 className="h-3 w-3 animate-spin" />}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Choose</span>
                    )}
                  </SelectTrigger>
                  <SelectContent align="end">
                    {couriers.map((c) => {
                      const off = cardDiscount(c);
                      return (
                        <SelectItem key={c.code} value={c.code} className="py-2">
                          <CourierLogo courier={c} className="h-6 w-10" />
                          <span>{c.label}</span>
                          {c.badge && <span className="text-xs text-emerald-700">{c.badge}</span>}
                          {c.price !== undefined && (
                            <span className="ml-auto pl-4 font-medium tabular-nums">
                              {formatCurrency(Math.max(c.price - off, 0))}
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </ListRow>

            <ListRow label="Handover">
              <Select
                value={deliveryType}
                onValueChange={(v) => setDeliveryType(v as DeliveryType)}
                disabled={isLoading}
              >
                <SelectTrigger aria-label="Handover" className={ROW_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="pickup">Courier pickup</SelectItem>
                  <SelectItem value="dropoff">Drop-off</SelectItem>
                </SelectContent>
              </Select>
            </ListRow>

            <ListRow label="Voucher">
              {vouchersOff ? (
                <button
                  type="button"
                  onClick={() => setVoucherSignIn(true)}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-amber-800 hover:bg-amber-50"
                >
                  <Ticket className="h-4 w-4" />
                  {voucherSession?.state === 'expired' ? 'Signed out · Sign in' : 'Sign in to use'}
                </button>
              ) : fittingVouchers.length > 0 ? (
                <Select value={voucherChoice ?? 'none'} onValueChange={setVoucherChoice} disabled={isLoading}>
                  <SelectTrigger aria-label="Voucher" className={ROW_TRIGGER}>
                    {chosenVoucher ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{chosenVoucher.voucher.name ?? 'Voucher'}</span>
                        <span className="font-semibold tabular-nums text-emerald-700">
                          −{formatCurrency(chosenVoucher.discount)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </SelectTrigger>
                  <SelectContent align="end">
                    {fittingVouchers.map(({ voucher, discount }) => (
                      <SelectItem key={voucher.id} value={voucher.id as string} className="py-2">
                        <span className="flex flex-col">
                          <span>
                            {voucher.name ?? 'Voucher'}{' '}
                            <span className="text-emerald-700">−{formatCurrency(discount)}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {voucher.left} left · until {shortDate(voucher.nextExpiry)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="none">No voucher</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="px-2 text-sm text-muted-foreground">None for this courier</span>
              )}
            </ListRow>

            <ListRow label="Cash on delivery" htmlFor="cod-toggle">
              <span className="px-2">
                <Switch
                  id="cod-toggle"
                  checked={codEnabled}
                  onCheckedChange={setCodEnabled}
                  disabled={isLoading}
                />
              </span>
            </ListRow>
            {codEnabled && (
              <div className="flex flex-col items-end pb-2">
                <div className="relative w-[180px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    RM
                  </span>
                  <Input
                    id="cod-amount"
                    aria-label="Amount to collect"
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
                {codInvalid && <p className="mt-1.5 text-xs text-red-600">Enter an amount above RM 0.</p>}
              </div>
            )}
          </section>

          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Weight <span className="tabular-nums text-foreground">{weightKg} kg</span>
            </span>
            <span>
              Value <span className="tabular-nums text-foreground">{formatCurrency(contentValue)}</span>
            </span>
            <span className="min-w-0 truncate">
              Contents <span className="text-foreground">{content}</span>
            </span>
          </p>

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

        <div className="flex flex-wrap items-center gap-3 border-t bg-muted/20 px-6 py-4">
          <div className="mr-auto flex flex-col">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold tabular-nums">
              {total !== undefined ? formatCurrency(total) : '—'}
              {voucherOff > 0 && selectedCourier?.price !== undefined && (
                <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                  {formatCurrency(selectedCourier.price)}
                </span>
              )}
            </span>
          </div>
          <Button variant="outline" disabled={isLoading} onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateShipment} disabled={!canSubmit} className="min-w-28">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create'
            )}
          </Button>
        </div>
        <VoucherSignInDialog open={voucherSignIn} onOpenChange={setVoucherSignIn} />
      </DialogContent>
    </Dialog>
  );
}
