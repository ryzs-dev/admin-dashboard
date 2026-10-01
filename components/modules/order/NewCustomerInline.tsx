'use client';

import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/forms/Field';
import { errorMessage } from '@/components/forms/FormDialog';
import { createNewCustomer } from '@/lib/api/customer';
import { formatPhone } from '@/lib/utils/phone';
import { Customer } from '../customer/types';

type NewCustomerInlineProps = {
  initialQuery: string;
  onCreated: (customer: Customer) => void;
  onCancel: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksLikePhone(value: string) {
  return /^[+\d\s()-]{6,}$/.test(value.trim());
}

export default function NewCustomerInline({
  initialQuery,
  onCreated,
  onCancel,
}: NewCustomerInlineProps) {
  const [name, setName] = useState(looksLikePhone(initialQuery) ? '' : initialQuery.trim());
  const [phone, setPhone] = useState(looksLikePhone(initialQuery) ? initialQuery.trim() : '');
  const [email, setEmail] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Customer | null>(null);

  const errors = {
    name: !name.trim() ? 'Enter the customer’s name.' : undefined,
    phone:
      phone.replace(/\D/g, '').length < 8
        ? 'Enter a phone number, e.g. 012-345 6789 or +65 9123 4567.'
        : undefined,
    email:
      email.trim() && !EMAIL_PATTERN.test(email.trim())
        ? 'This doesn’t look like an email address.'
        : undefined,
  };

  const handleCreate = async () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setError(null);
    setExisting(null);
    try {
      const result = await createNewCustomer({
        name: name.trim(),
        phone_number: phone.trim(),
        email: email.trim() || undefined,
        repeat_customer: 'new',
      });
      onCreated({ total_purchase_count: 0, ...result.data } as Customer);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data?.data) {
        setExisting(err.response.data.data as Customer);
      } else {
        setError(errorMessage(err, 'Couldn’t add the customer. Please try again.'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Enter would otherwise submit the surrounding order form.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">New customer</p>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-sm font-medium text-primary hover:underline"
        >
          Search instead
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="new-customer-name" error={showErrors ? errors.name : undefined}>
          <Input
            id="new-customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus={!name}
            disabled={saving}
            className="bg-background"
          />
        </Field>
        <Field
          label="Phone number"
          htmlFor="new-customer-phone"
          error={showErrors ? errors.phone : undefined}
        >
          <Input
            id="new-customer-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setExisting(null);
            }}
            onKeyDown={onKeyDown}
            autoFocus={!!name}
            placeholder="012-345 6789"
            disabled={saving}
            className="bg-background font-mono"
          />
        </Field>
      </div>

      <Field
        label="Email"
        htmlFor="new-customer-email"
        optional
        error={showErrors ? errors.email : undefined}
      >
        <Input
          id="new-customer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={saving}
          className="bg-background"
        />
      </Field>

      {existing && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            This number already belongs to{' '}
            <span className="font-medium">{existing.name || 'a customer'}</span> (
            {formatPhone(existing.phone_number)}).
          </div>
          <button
            type="button"
            onClick={() => onCreated(existing)}
            className="shrink-0 font-medium underline-offset-2 hover:underline"
          >
            Use this customer
          </button>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleCreate} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Adding…' : 'Add customer'}
        </Button>
      </div>
    </div>
  );
}
