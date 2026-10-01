'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, SegmentedChoice } from './Field';

export type AddressCountry = 'Malaysia' | 'Singapore';

export type AddressDraft = {
  country: AddressCountry;
  full_address: string;
  postcode: string;
  city: string;
  state: string;
};

type ExistingAddress = {
  full_address?: string | null;
  postcode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export const MALAYSIAN_STATES = [
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

export function addressDraft(address?: ExistingAddress | null): AddressDraft {
  return {
    country: address?.country === 'Singapore' ? 'Singapore' : 'Malaysia',
    full_address: address?.full_address ?? '',
    postcode: address?.postcode ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
  };
}

export function addressErrors(draft: AddressDraft) {
  const postcode = draft.postcode.trim();
  const length = draft.country === 'Singapore' ? 6 : 5;
  return {
    full_address: !draft.full_address.trim() ? 'Enter the street address.' : undefined,
    postcode: !postcode
      ? 'Enter the postcode.'
      : !new RegExp(`^\\d{${length}}$`).test(postcode)
        ? `${draft.country} postcodes have ${length} digits.`
        : undefined,
  };
}

export function addressPayload(draft: AddressDraft) {
  const singapore = draft.country === 'Singapore';
  return {
    full_address: draft.full_address.trim(),
    postcode: draft.postcode.trim(),
    city: singapore ? draft.city.trim() || 'Singapore' : draft.city.trim(),
    state: singapore ? '' : draft.state,
    country: draft.country,
  };
}

export function AddressFields({
  value,
  onChange,
  disabled,
  showErrors,
  idPrefix = 'address',
}: {
  value: AddressDraft;
  onChange: (value: AddressDraft) => void;
  disabled?: boolean;
  showErrors?: boolean;
  idPrefix?: string;
}) {
  const set = <K extends keyof AddressDraft>(field: K) => (next: AddressDraft[K]) =>
    onChange({ ...value, [field]: next });

  const errors = addressErrors(value);
  // Partial postcodes are flagged as soon as they're typed; empty fields only after submit.
  const postcodeError =
    showErrors || (value.postcode.trim() && errors.postcode) ? errors.postcode : undefined;
  const postcodeLength = value.country === 'Singapore' ? 6 : 5;
  const stateOptions =
    value.state && !MALAYSIAN_STATES.includes(value.state)
      ? [value.state, ...MALAYSIAN_STATES]
      : MALAYSIAN_STATES;

  return (
    <div className="space-y-4">
      <Field label="Country">
        <SegmentedChoice
          label="Country"
          value={value.country}
          onChange={set('country')}
          options={[
            { value: 'Malaysia', label: 'Malaysia' },
            { value: 'Singapore', label: 'Singapore' },
          ]}
          disabled={disabled}
        />
      </Field>

      <Field
        label="Address"
        htmlFor={`${idPrefix}-line`}
        hint="House or unit number, street and area."
        error={showErrors ? errors.full_address : undefined}
      >
        <Textarea
          id={`${idPrefix}-line`}
          rows={3}
          value={value.full_address}
          onChange={(e) => set('full_address')(e.target.value)}
          placeholder={
            value.country === 'Singapore'
              ? 'Blk 123 Tampines St 11, #05-67'
              : '12, Jalan Mawar 3, Taman Melati'
          }
          className="resize-none bg-background"
          disabled={disabled}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Postcode" htmlFor={`${idPrefix}-postcode`} error={postcodeError}>
          <Input
            id={`${idPrefix}-postcode`}
            inputMode="numeric"
            maxLength={postcodeLength}
            value={value.postcode}
            onChange={(e) => set('postcode')(e.target.value.replace(/\D/g, ''))}
            className="bg-background tabular-nums"
            disabled={disabled}
          />
        </Field>
        <Field label="City" htmlFor={`${idPrefix}-city`}>
          <Input
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(e) => set('city')(e.target.value)}
            placeholder={value.country === 'Singapore' ? 'Singapore' : undefined}
            className="bg-background"
            disabled={disabled}
          />
        </Field>
      </div>

      {value.country === 'Malaysia' && (
        <Field label="State">
          <Select value={value.state} onValueChange={set('state')} disabled={disabled}>
            <SelectTrigger className="w-full bg-background">
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
    </div>
  );
}
