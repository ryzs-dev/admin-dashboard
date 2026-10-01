'use client';

import { useEffect, useState } from 'react';
import { Field } from '@/components/forms/Field';
import { MALAYSIAN_STATES } from '@/components/forms/AddressFields';
import { errorMessage, FormDialog } from '@/components/forms/FormDialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParcelDailySettings, saveParcelDailySettings } from '@/lib/api/parcel-daily';

type Draft = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
};

const toDraft = (a: ParcelDailySettings['pickupAddress']): Draft => ({
  fullName: a.fullName ?? '',
  phone: a.phone ?? '',
  email: a.email ?? '',
  line1: a.line1 ?? '',
  line2: a.line2 ?? '',
  postcode: a.postcode ?? '',
  city: a.city ?? '',
  state: a.state ?? '',
});

const localPhone = (phone: string) => phone.replace(/\D/g, '').replace(/^60/, '').replace(/^0/, '');

function validate(d: Draft) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.fullName.trim()) errors.fullName = 'Sender name is required';
  if (!/^1\d{7,9}$/.test(localPhone(d.phone))) errors.phone = 'Enter a Malaysian mobile number';
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
    errors.email = 'Enter a valid email';
  }
  if (!d.line1.trim()) errors.line1 = 'Address is required';
  if (!/^\d{5}$/.test(d.postcode)) errors.postcode = 'Postcode must be 5 digits';
  if (!d.city.trim()) errors.city = 'City is required';
  if (!d.state) errors.state = 'State is required';
  return errors;
}

export function PickupAddressDialog({
  open,
  onOpenChange,
  settings,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ParcelDailySettings;
  onSaved: (next: ParcelDailySettings) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings.pickupAddress));
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(toDraft(settings.pickupAddress));
    setShowErrors(false);
    setServerErrors({});
    setError(null);
  }, [open, settings.pickupAddress]);

  const errors = { ...validate(draft), ...serverErrors };
  const fieldError = (field: keyof Draft) => (showErrors ? errors[field] : undefined);
  const set = (field: keyof Draft) => (value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setServerErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const stateOptions =
    draft.state && !MALAYSIAN_STATES.includes(draft.state)
      ? [draft.state, ...MALAYSIAN_STATES]
      : MALAYSIAN_STATES;

  const handleSubmit = async () => {
    setShowErrors(true);
    if (Object.keys(validate(draft)).length) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveParcelDailySettings({
        pickupAddress: {
          fullName: draft.fullName.trim(),
          countryCode: '+60',
          phone: localPhone(draft.phone),
          email: draft.email.trim(),
          line1: draft.line1.trim(),
          line2: draft.line2.trim(),
          postcode: draft.postcode,
          city: draft.city.trim(),
          state: draft.state,
          country: 'Malaysia',
        },
        defaults: settings.defaults,
      });
      onSaved(next);
      onOpenChange(false);
    } catch (err) {
      const fields = (err as { response?: { data?: { fields?: Record<string, string> } } })
        ?.response?.data?.fields;
      if (fields) setServerErrors(fields);
      setError(errorMessage(err, 'Couldn’t save the pickup address'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pickup address"
      description="Couriers collect parcels here and it’s printed as the sender on labels. Prices are quoted from this postcode."
      onSubmit={handleSubmit}
      submitLabel="Save address"
      isSubmitting={saving}
      error={error}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Sender name" htmlFor="pd-name" error={fieldError('fullName')} className="col-span-2">
          <Input
            id="pd-name"
            value={draft.fullName}
            onChange={(e) => set('fullName')(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Phone" htmlFor="pd-phone" error={fieldError('phone')}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              +60
            </span>
            <Input
              id="pd-phone"
              inputMode="tel"
              value={draft.phone}
              onChange={(e) => set('phone')(e.target.value.replace(/[^\d\s-]/g, ''))}
              className="pl-11 tabular-nums"
              disabled={saving}
            />
          </div>
        </Field>
        <Field label="Email" htmlFor="pd-email" optional error={fieldError('email')}>
          <Input
            id="pd-email"
            type="email"
            value={draft.email}
            onChange={(e) => set('email')(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Address line 1" htmlFor="pd-line1" error={fieldError('line1')} className="col-span-2">
          <Input
            id="pd-line1"
            value={draft.line1}
            onChange={(e) => set('line1')(e.target.value)}
            placeholder="76, Jalan Kulim"
            disabled={saving}
          />
        </Field>
        <Field label="Address line 2" htmlFor="pd-line2" optional className="col-span-2">
          <Input
            id="pd-line2"
            value={draft.line2}
            onChange={(e) => set('line2')(e.target.value)}
            placeholder="Taman Tenang"
            disabled={saving}
          />
        </Field>
        <Field label="Postcode" htmlFor="pd-postcode" error={fieldError('postcode')}>
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
        <Field label="City" htmlFor="pd-city" error={fieldError('city')}>
          <Input
            id="pd-city"
            value={draft.city}
            onChange={(e) => set('city')(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="State" error={fieldError('state')} className="col-span-2">
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
    </FormDialog>
  );
}
