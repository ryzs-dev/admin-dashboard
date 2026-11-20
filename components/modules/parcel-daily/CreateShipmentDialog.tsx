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

  // Best voucher saving for a courier card (0 when staff picked "No voucher").
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

  // Three cheapest as cards; the picked courier always stays visible.
  const [showAllCouriers, setShowAllCouriers] = useState(false);
  useEffect(() => {
    if (!isOpen) setShowAllCouriers(false);
  }, [isOpen]);
  const cardCouriers = useMemo(() => {
    if (showAllCouriers || couriers.length <= 3) return couriers;
    const top = couriers.slice(0, 3);
    if (!selectedCourier || top.some((c) => c.code === selectedCourier.code)) return top;
    return [...top.slice(0, 2), selectedCourier];
  }, [couriers, showAllCouriers, selectedCourier]);

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

          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                Courier
                {quoteRefreshing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </h3>
              {couriers.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllCouriers((v) => !v)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {showAllCouriers ? 'Fewer couriers' : `All ${couriers.length} couriers`}
                </button>
              )}
            </div>

            {!postcodeValid ? (
              <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Add a valid postcode to see which couriers deliver there.
              </p>
            ) : quoteLoading && !quote ? (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[118px] animate-pulse rounded-xl border bg-muted/40" />
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
                <div role="radiogroup" aria-label="Courier" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {cardCouriers.map((c) => {
                    const on = c.code === courier;
                    const off = cardDiscount(c);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={isLoading}
                        onClick={() => setCourier(c.code)}
                        className={cn(
                          'flex min-w-0 flex-col items-start gap-2 rounded-xl border bg-white p-3 text-left transition-shadow',
                          on
                            ? 'border-primary ring-[3px] ring-primary/15'
                            : 'hover:border-foreground/25'
                        )}
                      >
                        <CourierLogo courier={c} className="h-7 w-12" />
                        <span className="w-full truncate text-xs text-muted-foreground">{c.label}</span>
                        <span className="text-base font-bold tabular-nums leading-tight">
                          {c.price !== undefined ? formatCurrency(Math.max(c.price - off, 0)) : '—'}
                          {off > 0 && c.price !== undefined && (
                            <span className="block text-[11px] font-normal text-muted-foreground line-through">
                              {formatCurrency(c.price)}
                            </span>
                          )}
                        </span>
                        {c.badge && <span className="text-[11px] font-medium text-emerald-700">{c.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-1.5 text-xs text-muted-foreground">Handover</p>
              <div role="radiogroup" aria-label="Handover" className="grid h-10 grid-cols-2 rounded-lg border bg-muted/50 p-[3px]">
                {(['pickup', 'dropoff'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={deliveryType === value}
                    disabled={isLoading}
                    onClick={() => setDeliveryType(value)}
                    className={cn(
                      'rounded-md text-sm transition-colors',
                      deliveryType === value
                        ? 'bg-white font-medium text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {value === 'pickup' ? 'Pickup' : 'Drop-off'}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1.5 text-xs text-muted-foreground">Voucher</p>
              {vouchersOff ? (
                <button
                  type="button"
                  onClick={() => setVoucherSignIn(true)}
                  disabled={isLoading}
                  className="flex h-10 w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-left text-sm text-amber-900"
                >
                  <Ticket className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">
                    {voucherSession?.state === 'expired' ? 'Signed out' : 'Off'}
                  </span>
                  <span className="font-medium">Sign in</span>
                </button>
              ) : fittingVouchers.length > 0 ? (
                <Select value={voucherChoice ?? 'none'} onValueChange={setVoucherChoice} disabled={isLoading}>
                  <SelectTrigger aria-label="Voucher" className="h-10 w-full bg-white data-[size=default]:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fittingVouchers.map(({ voucher, discount }) => (
                      <SelectItem key={voucher.id} value={voucher.id as string}>
                        <span className="font-medium">{voucher.name ?? 'Voucher'}</span>
                        <span className="text-emerald-700">−{formatCurrency(discount)}</span>
                        <span className="text-muted-foreground">
                          {voucher.left} left · until {shortDate(voucher.nextExpiry)}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="none">No voucher</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="flex h-10 items-center rounded-lg border border-dashed px-3 text-sm text-muted-foreground">
                  None for this courier
                </p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="cod-toggle" className="cursor-pointer text-sm">
                Cash on delivery
              </label>
              <Switch
                id="cod-toggle"
                checked={codEnabled}
                onCheckedChange={setCodEnabled}
                disabled={isLoading}
              />
            </div>
            {codEnabled && (
              <div className="mt-3">
                <div className="relative max-w-[200px]">
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
