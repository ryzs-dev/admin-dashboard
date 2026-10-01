'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import { Field, ChoiceField } from '@/components/forms/Field';
import { CustomerInput } from '@/types/customer';
import { formatPhone } from '@/lib/utils/phone';

type Status = CustomerInput['repeat_customer'];

type EditCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    name?: string;
    phone_number?: string;
    email?: string | null;
    fb_name?: string | null;
    repeat_customer?: Status;
  };
  onSubmit: (data: Partial<CustomerInput>) => Promise<void>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
}: EditCustomerDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fbName, setFbName] = useState('');
  const [status, setStatus] = useState<Status>('new');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(customer.name ?? '');
    setPhone(customer.phone_number ? formatPhone(customer.phone_number) : '');
    setEmail(customer.email ?? '');
    setFbName(customer.fb_name ?? '');
    setStatus(customer.repeat_customer ?? 'new');
    setShowErrors(false);
    setError(null);
  }, [open, customer]);

  const phoneDigits = phone.replace(/\D/g, '');
  const errors = {
    name: !name.trim() ? 'Enter the customer’s name.' : undefined,
    phone:
      phoneDigits.length < 8
        ? 'Enter a phone number, e.g. 012-345 6789 or +65 9123 4567.'
        : undefined,
    email:
      email.trim() && !EMAIL_PATTERN.test(email.trim())
        ? 'This doesn’t look like an email address.'
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
      await onSubmit({
        name: name.trim(),
        phone_number: phone.trim(),
        email: email.trim(),
        fb_name: fbName.trim(),
        repeat_customer: status,
      });
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save the customer. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const phoneChanged = phoneDigits !== (customer.phone_number ?? '').replace(/\D/g, '');

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit customer"
      description="Update contact details used for orders, shipping and WhatsApp."
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      isSubmitting={saving}
      error={error}
    >
      <Field label="Name" htmlFor="customer-name" error={showErrors ? errors.name : undefined}>
        <Input
          id="customer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
      </Field>

      <Field
        label="Phone number"
        htmlFor="customer-phone"
        error={showErrors ? errors.phone : undefined}
        hint={
          phoneChanged && !errors.phone
            ? `Will be saved as ${formatPhone(normalizePreview(phoneDigits))}. WhatsApp messages go to this number.`
            : 'Malaysian numbers can start with 0. Singapore numbers need +65 unless they start with 8 or 9.'
        }
      >
        <Input
          id="customer-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="font-mono"
          disabled={saving}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Email"
          htmlFor="customer-email"
          optional
          error={showErrors ? errors.email : undefined}
        >
          <Input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
          />
        </Field>

        <Field label="Facebook name" htmlFor="customer-fb" optional>
          <Input
            id="customer-fb"
            value={fbName}
            onChange={(e) => setFbName(e.target.value)}
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Customer type" hint="Returning customers have ordered more than once.">
        <ChoiceField
          label="Customer type"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'new', label: 'New' },
            { value: 'returning', label: 'Returning' },
          ]}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}

// Mirrors the backend's normalisation so staff see the number that will be stored.
function normalizePreview(digits: string) {
  if (digits.startsWith('60') || digits.startsWith('65')) return digits;
  if (digits.startsWith('0')) return `60${digits.slice(1)}`;
  if (/^[89]\d{7}$/.test(digits)) return `65${digits}`;
  return digits;
}
