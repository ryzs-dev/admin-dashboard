'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  Loader2,
  MapPin,
  Plug,
  Settings2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Field, SegmentedChoice } from '@/components/forms/Field';
import { MALAYSIAN_STATES } from '@/components/forms/AddressFields';
import { errorMessage } from '@/components/forms/FormDialog';
import { CourierPicker } from '@/components/modules/parcel-daily/CourierPicker';
import { BOOKABLE_COURIERS } from '@/components/modules/parcel-daily/couriers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParcelDailyAccount, useParcelDailySettings } from '@/hooks/useParcelDaily';
import { ParcelDailySettings, saveParcelDailySettings } from '@/lib/api/parcel-daily';
import { formatFriendlyDateTime } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';

const PARTNER_PORTAL_URL = 'https://partner.parceldaily.com';
const LOW_CREDIT_RM = 50;

type Draft = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  kg: string;
  isDropoff: boolean;
  courier: string;
};

function toDraft(settings: ParcelDailySettings): Draft {
  const a = settings.pickupAddress;
  return {
    fullName: a.fullName ?? '',
    phone: a.phone ?? '',
    email: a.email ?? '',
    line1: a.line1 ?? '',
    line2: a.line2 ?? '',
    postcode: a.postcode ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    kg: String(settings.defaults.kg ?? 0.5),
    isDropoff: settings.defaults.isDropoff === true,
    courier: settings.defaults.courier ?? 'spx',
  };
}

function draftErrors(d: Draft) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.fullName.trim()) errors.fullName = 'Sender name is required';
  if (!/^1\d{7,9}$/.test(d.phone.replace(/\D/g, '').replace(/^60/, '').replace(/^0/, ''))) {
    errors.phone = 'Enter a Malaysian mobile number';
  }
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
    errors.email = 'Enter a valid email';
  }
  if (!d.line1.trim()) errors.line1 = 'Address is required';
  if (!/^\d{5}$/.test(d.postcode)) errors.postcode = 'Postcode must be 5 digits';
  if (!d.city.trim()) errors.city = 'City is required';
  if (!d.state) errors.state = 'State is required';
  const kg = Number(d.kg);
  if (!(kg > 0 && kg <= 30)) errors.kg = 'Between 0.1 and 30 kg';
  return errors;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start gap-3 border-b px-5 py-4">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export default function ParcelDailyPage() {
  const { account, isLoading: accountLoading, isError: accountError } = useParcelDailyAccount();
  const { settings, isLoading, isError, refresh } = useParcelDailySettings();

  const saved = useMemo(() => (settings ? toDraft(settings) : null), [settings]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);
  const errors = draft ? { ...draftErrors(draft), ...fieldErrors } : {};
  const visibleError = (field: keyof Draft) => (showErrors ? errors[field] : undefined);

  const set =
    <K extends keyof Draft>(field: K) =>
    (value: Draft[K]) => {
      setDraft((d) => (d ? { ...d, [field]: value } : d));
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    };

  const handleSave = async () => {
    if (!draft) return;
    setShowErrors(true);
    if (Object.keys(draftErrors(draft)).length) return;
    setSaving(true);
    try {
      const next = await saveParcelDailySettings({
        pickupAddress: {
          fullName: draft.fullName.trim(),
          countryCode: '+60',
          phone: draft.phone,
          email: draft.email.trim(),
          line1: draft.line1.trim(),
          line2: draft.line2.trim(),
          postcode: draft.postcode,
          city: draft.city.trim(),
          state: draft.state,
          country: 'Malaysia',
        },
        defaults: { kg: Number(draft.kg), isDropoff: draft.isDropoff, courier: draft.courier },
      });
      await refresh({ ...next, connection: settings?.connection }, { revalidate: false });
      setShowErrors(false);
      toast.success('Parcel Daily settings saved');
    } catch (err) {
      const fields = (err as { response?: { data?: { fields?: Record<string, string> } } })
        ?.response?.data?.fields;
      if (fields) setFieldErrors(fields);
      toast.error(errorMessage(err, 'Couldn’t save Parcel Daily settings'));
    } finally {
      setSaving(false);
    }
  };

  const credit = Number(account?.credit ?? 0);
  const lowCredit = !!account && credit < LOW_CREDIT_RM;
  const stateOptions =
    draft?.state && !MALAYSIAN_STATES.includes(draft.state)
      ? [draft.state, ...MALAYSIAN_STATES]
      : MALAYSIAN_STATES;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6 pb-20">
        <PageHeader
          title="Parcel Daily"
          description="The courier account shipments are booked and paid from."
        >
          <Button variant="outline" asChild className="gap-1.5">
            <a href={PARTNER_PORTAL_URL} target="_blank" rel="noreferrer">
              Open Parcel Daily
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Credit balance"
            icon={Wallet}
            isLoading={accountLoading}
            value={accountError ? '—' : formatCurrency(credit)}
            hint={
              accountError ? (
                'Couldn’t reach Parcel Daily'
              ) : (
                <a
                  href={PARTNER_PORTAL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Top up credit
                </a>
              )
            }
            className={lowCredit ? 'border-amber-300 bg-amber-50/60' : undefined}
          />
          <StatCard
            label="Top-up package"
            icon={CalendarClock}
            isLoading={accountLoading}
            value={<span className="capitalize">{account?.topupPackage ?? '—'}</span>}
            hint={
              account
                ? `${account.expiresIn} of ${account.packageValidDays} days left`
                : undefined
            }
          />
          <StatCard
            label="Connection"
            icon={Plug}
            isLoading={isLoading}
            value={
              settings?.connection ? (
                <span className="flex items-center gap-2 text-lg">
                  <span
                    className={`h-2 w-2 rounded-full ${accountError ? 'bg-red-500' : 'bg-emerald-500'}`}
                  />
                  {accountError ? 'Not connected' : settings.connection.environment === 'live' ? 'Live account' : 'Sandbox'}
                </span>
              ) : (
                '—'
              )
            }
            hint={settings?.connection ? `Merchant ID ${settings.connection.merchantId}` : undefined}
          />
        </div>

        {lowCredit && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Credit is below {formatCurrency(LOW_CREDIT_RM)}. Shipments fail to book once it runs
              out, so top up in Parcel Daily soon.
            </p>
          </div>
        )}

        {isError ? (
          <Card className="items-center gap-2 px-6 py-16 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium">Couldn’t load Parcel Daily settings</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
              Try again
            </Button>
          </Card>
        ) : !draft ? (
          <div className="space-y-4">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <SectionCard
              icon={MapPin}
              title="Pickup address"
              description="Couriers collect parcels here and it’s printed as the sender on every label. Prices are quoted from this postcode."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sender name" htmlFor="pd-name" error={visibleError('fullName')}>
                  <Input
                    id="pd-name"
                    value={draft.fullName}
                    onChange={(e) => set('fullName')(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="Phone" htmlFor="pd-phone" error={visibleError('phone')}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      +60
                    </span>
                    <Input
                      id="pd-phone"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(e) => set('phone')(e.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder="11 5869 9901"
                      className="pl-11 tabular-nums"
                      disabled={saving}
                    />
                  </div>
                </Field>
                <Field
                  label="Email"
                  htmlFor="pd-email"
                  optional
                  error={visibleError('email')}
                  className="sm:col-span-2"
                >
                  <Input
                    id="pd-email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => set('email')(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field
                  label="Address line 1"
                  htmlFor="pd-line1"
                  error={visibleError('line1')}
                  className="sm:col-span-2"
                >
                  <Input
                    id="pd-line1"
                    value={draft.line1}
                    onChange={(e) => set('line1')(e.target.value)}
                    placeholder="76, Jalan Kulim"
                    disabled={saving}
                  />
                </Field>
                <Field label="Address line 2" htmlFor="pd-line2" optional className="sm:col-span-2">
                  <Input
                    id="pd-line2"
                    value={draft.line2}
                    onChange={(e) => set('line2')(e.target.value)}
                    placeholder="Taman Tenang"
                    disabled={saving}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-3">
                  <Field label="Postcode" htmlFor="pd-postcode" error={visibleError('postcode')}>
                    <Input
                      id="pd-postcode"
                      inputMode="numeric"
                      maxLength={5}
                      value={draft.postcode}
                      onChange={(e) => set('postcode')(e.target.value.replace(/\D/g, ''))}
                      className="tabular-nums"
                      disabled={saving}
                    />
                  </Field>
                  <Field label="City" htmlFor="pd-city" error={visibleError('city')}>
                    <Input
                      id="pd-city"
                      value={draft.city}
                      onChange={(e) => set('city')(e.target.value)}
                      disabled={saving}
                    />
                  </Field>
                  <Field
                    label="State"
                    error={visibleError('state')}
                    className="col-span-2 sm:col-span-1"
                  >
                    <Select value={draft.state} onValueChange={set('state')} disabled={saving}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a state" />
                      </SelectTrigger>
                      <SelectContent>
                        {stateOptions.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Settings2}
              title="Shipping defaults"
              description="Pre-filled when creating shipments. Staff can still change the courier and handover per order."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Default courier"
                  hint="Used when it serves the destination; otherwise the cheapest courier is picked."
                  className="sm:col-span-2"
                >
                  <CourierPicker
                    couriers={BOOKABLE_COURIERS.Malaysia}
                    value={draft.courier}
                    onChange={set('courier')}
                    disabled={saving}
                    layout="select"
                  />
                </Field>
                <Field label="Handover">
                  <SegmentedChoice
                    label="Handover"
                    value={draft.isDropoff ? 'dropoff' : 'pickup'}
                    onChange={(v) => set('isDropoff')(v === 'dropoff')}
                    options={[
                      { value: 'pickup', label: 'Courier pickup' },
                      { value: 'dropoff', label: 'Drop-off' },
                    ]}
                    disabled={saving}
                  />
                </Field>
                <Field
                  label="Parcel weight"
                  htmlFor="pd-kg"
                  hint="Used for pricing every shipment."
                  error={visibleError('kg')}
                >
                  <div className="relative">
                    <Input
                      id="pd-kg"
                      type="number"
                      inputMode="decimal"
                      min={0.1}
                      max={30}
                      step={0.1}
                      value={draft.kg}
                      onChange={(e) => set('kg')(e.target.value)}
                      className="pr-10 tabular-nums"
                      disabled={saving}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      kg
                    </span>
                  </div>
                </Field>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {draft && (dirty || saving) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:left-[var(--sidebar-width,16rem)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3 lg:px-8">
            <p className="text-sm text-muted-foreground">
              Unsaved changes
              {settings?.updatedAt && (
                <span className="hidden sm:inline">
                  {' '}
                  · last saved {formatFriendlyDateTime(settings.updatedAt)}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(saved);
                  setShowErrors(false);
                  setFieldErrors({});
                }}
                disabled={saving}
              >
                Discard
              </Button>
              <Button onClick={handleSave} disabled={saving} className="min-w-28">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
