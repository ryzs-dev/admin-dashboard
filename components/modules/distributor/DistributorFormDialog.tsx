'use client';

import { useEffect, useState } from 'react';
import { Field } from '@/components/forms/Field';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import { Input } from '@/components/ui/input';
import { DistributorInput } from '@/types/distributor';

export default function DistributorFormDialog({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DistributorInput) => Promise<void>;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setName('');
      setShowErrors(false);
      setError(null);
    }
  }, [isOpen]);

  const phoneError = phoneNumber.replace(/\D/g, '').length < 8
    ? 'Enter a phone number, e.g. 012-345 6789'
    : undefined;

  const handleSubmit = async () => {
    setShowErrors(true);
    if (phoneError) return;

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        phone_number: phoneNumber.trim(),
        name: name.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t add the distributor. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Add distributor"
      description="Orders for this phone number, including ones sent through WhatsApp, go to Distributors instead of Orders."
      size="sm"
      onSubmit={handleSubmit}
      submitLabel="Add distributor"
      submittingLabel="Adding…"
      isSubmitting={saving}
      error={error}
    >
      <Field
        label="Phone number"
        htmlFor="distributor-phone"
        error={showErrors ? phoneError : undefined}
        hint="Existing orders for this number move to Distributors too."
      >
        <Input
          id="distributor-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g. 012-345 6789"
          autoComplete="off"
          autoFocus
          disabled={saving}
        />
      </Field>

      <Field label="Name" htmlFor="distributor-name" optional>
        <Input
          id="distributor-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Penang agent"
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}
