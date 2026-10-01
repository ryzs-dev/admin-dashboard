'use client';

import { useEffect, useState } from 'react';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import {
  AddressDraft,
  AddressFields,
  addressDraft,
  addressErrors,
  addressPayload,
} from '@/components/forms/AddressFields';

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

const EditAddressDialog = ({ address, open, onOpenChange, onSubmit }: Props) => {
  const [draft, setDraft] = useState<AddressDraft>(addressDraft());
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(addressDraft(address));
    setShowErrors(false);
    setError(null);
  }, [open, address]);

  const handleSubmit = async () => {
    if (Object.values(addressErrors(draft)).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(addressPayload(draft));
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
      title={address ? 'Edit shipping address' : 'Add shipping address'}
      description="Used for this order’s shipment."
      onSubmit={handleSubmit}
      submitLabel="Save address"
      isSubmitting={saving}
      error={error}
    >
      <AddressFields value={draft} onChange={setDraft} disabled={saving} showErrors={showErrors} />
    </FormDialog>
  );
};

export default EditAddressDialog;
