'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import { Field, SegmentedChoice } from '@/components/forms/Field';

type Address = {
  full_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

type Props = {
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Address) => Promise<void>;
};

type Country = 'Malaysia' | 'Singapore';

const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Wp Kuala Lumpur',
  'Wp Labuan',
  'Wp Putrajaya',
];

const EMPTY = { full_address: '', city: '', state: '', postcode: '' };

const EditAddressDialog = ({ address, open, onOpenChange, onSubmit }: Props) => {
  const [form, setForm] = useState(EMPTY);
  const [country, setCountry] = useState<Country>('Malaysia');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      full_address: address?.full_address ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      postcode: address?.postcode ?? '',
    });
    setCountry(address?.country === 'Singapore' ? 'Singapore' : 'Malaysia');
    setError(null);
  }, [open, address]);

  const set = (field: keyof typeof EMPTY) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const postcode = form.postcode.trim();
  const postcodeLength = country === 'Singapore' ? 6 : 5;
  const postcodeError =
    postcode && !new RegExp(`^\\d{${postcodeLength}}$`).test(postcode)
      ? `${country} postcodes have ${postcodeLength} digits.`
      : undefined;
  const stateOptions =
    form.state && !MALAYSIAN_STATES.includes(form.state)
      ? [form.state, ...MALAYSIAN_STATES]
      : MALAYSIAN_STATES;

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        full_address: form.full_address.trim(),
        postcode,
        city: country === 'Singapore' ? form.city.trim() || 'Singapore' : form.city.trim(),
        state: country === 'Singapore' ? '' : form.state,
        country,
      });
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save the address. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit shipping address"
      description="Changes apply to this order and its next shipment."
      onSubmit={handleSubmit}
      submitLabel="Save address"
      isSubmitting={saving}
      submitDisabled={!form.full_address.trim() || !!postcodeError}
      error={error}
    >
      <Field label="Country">
        <SegmentedChoice
          label="Country"
          value={country}
          onChange={setCountry}
          options={[
            { value: 'Malaysia', label: 'Malaysia' },
            { value: 'Singapore', label: 'Singapore' },
          ]}
          disabled={saving}
        />
      </Field>

      <Field label="Address" htmlFor="address-line" hint="House or unit number, street and area.">
        <Textarea
          id="address-line"
          rows={3}
          value={form.full_address}
          onChange={(e) => set('full_address')(e.target.value)}
          placeholder={
            country === 'Singapore'
              ? 'Blk 123 Tampines St 11, #05-67'
              : '12, Jalan Mawar 3, Taman Melati'
          }
          className="resize-none"
          disabled={saving}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Postcode" htmlFor="address-postcode" error={postcodeError}>
          <Input
            id="address-postcode"
            inputMode="numeric"
            maxLength={postcodeLength}
            value={form.postcode}
            onChange={(e) => set('postcode')(e.target.value.replace(/\D/g, ''))}
            className="tabular-nums"
            disabled={saving}
          />
        </Field>
        <Field label="City" htmlFor="address-city">
          <Input
            id="address-city"
            value={form.city}
            onChange={(e) => set('city')(e.target.value)}
            placeholder={country === 'Singapore' ? 'Singapore' : undefined}
            disabled={saving}
          />
        </Field>
      </div>

      {country === 'Malaysia' && (
        <Field label="State">
          <Select value={form.state} onValueChange={set('state')} disabled={saving}>
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
      )}
    </FormDialog>
  );
};

export default EditAddressDialog;
