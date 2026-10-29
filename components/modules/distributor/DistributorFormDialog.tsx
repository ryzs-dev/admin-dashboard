'use client';

import { useEffect, useState } from 'react';
import { MapPin, Store } from 'lucide-react';
import {
  AddressDraft,
  AddressFields,
  addressDraft,
  addressErrors,
  addressPayload,
} from '@/components/forms/AddressFields';
import { Field } from '@/components/forms/Field';
import { FormDialog, FormSection, errorMessage } from '@/components/forms/FormDialog';
import { Input } from '@/components/ui/input';
import { createAddress } from '@/lib/api/address';
import { ensureDistributorCustomer } from '@/lib/api/distributor';
import { formatPhone } from '@/lib/utils/phone';
import { Distributor, DistributorInput } from '@/types/distributor';

const isBlank = (draft: AddressDraft) =>
  !draft.full_address.trim() && !draft.postcode.trim() && !draft.city.trim();

// Adds a distributor (with an optional delivery address), or, given an existing
// distributor, adds a delivery address to it. Addresses are saved on the
// distributor's customer record, so New order offers them as saved addresses.
export default function DistributorFormDialog({
  isOpen,
  onClose,
  onSubmit,
  onSaved,
  distributor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DistributorInput) => Promise<Distributor>;
  onSaved?: () => void;
  distributor?: Distributor | null;
}) {
  const addingAddress = Boolean(distributor);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState<AddressDraft>(addressDraft());
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setName('');
      setAddress(addressDraft());
      setShowErrors(false);
      setError(null);
    }
  }, [isOpen]);

  const phoneError =
    !addingAddress && phoneNumber.replace(/\D/g, '').length < 8
      ? 'Enter a phone number, e.g. 012-345 6789'
      : undefined;
  // The address is optional when adding a distributor, required when that is
  // all the dialog is for.
  const wantsAddress = addingAddress || !isBlank(address);
  const errors = wantsAddress ? addressErrors(address) : {};
  const hasErrors = Boolean(phoneError) || Object.values(errors).some(Boolean);

  const handleSubmit = async () => {
    setShowErrors(true);
    if (hasErrors) return;

    setSaving(true);
    setError(null);
    try {
      const saved =
        distributor ??
        (await onSubmit({
          phone_number: phoneNumber.trim(),
          name: name.trim() || undefined,
        }));

      if (wantsAddress) {
        const customer = await ensureDistributorCustomer(saved);
        await createAddress({ ...addressPayload(address), customer_id: customer.id });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        errorMessage(
          err,
          addingAddress
            ? 'Couldn’t save the address. Please try again.'
            : 'Couldn’t add the distributor. Please try again.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={addingAddress ? 'Add delivery address' : 'Add distributor'}
      description={
        addingAddress
          ? `For ${distributor?.name || formatPhone(distributor?.phone_number)}. New orders offer it as a saved address.`
          : 'Orders for this phone number, including ones sent through WhatsApp, go to Distributors instead of Orders.'
      }
      size={addingAddress ? 'md' : 'lg'}
      onSubmit={handleSubmit}
      submitLabel={addingAddress ? 'Save address' : 'Add distributor'}
      submittingLabel={addingAddress ? 'Saving…' : 'Adding…'}
      isSubmitting={saving}
      error={error}
    >
      {!addingAddress && (
        <FormSection title="Distributor" icon={Store}>
          <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="e.g. Unicare Teku"
                disabled={saving}
              />
            </Field>
          </div>
        </FormSection>
      )}

      <FormSection
        title={addingAddress ? 'Address' : 'Delivery address (optional)'}
        icon={MapPin}
      >
        <AddressFields
          value={address}
          onChange={setAddress}
          disabled={saving}
          showErrors={showErrors && wantsAddress}
          idPrefix="distributor-address"
        />
      </FormSection>
    </FormDialog>
  );
}
