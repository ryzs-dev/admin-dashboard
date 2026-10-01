'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UUID } from 'crypto';
import { Input } from '@/components/ui/input';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import { Field, ChoiceField } from '@/components/forms/Field';
import { CourierPicker } from '../parcel-daily/CourierPicker';
import { TRACKING_COURIERS } from '../parcel-daily/constants';

export type Courier =
  | 'spx'
  | 'flash'
  | 'jnt'
  | 'kex'
  | 'sf_express'
  | 'poslaju'
  | 'dhl'
  | 'lex';

type MessageStatus = 'pending' | 'sent' | 'failed';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: {
    id: UUID;
    tracking_number?: string;
    courier?: Courier;
    message_status?: string;
  };
  onSubmit: (
    trackingId: UUID,
    payload: {
      tracking_number: string;
      courier: Courier;
      message_status: string;
    }
  ) => Promise<void>;
}

const MESSAGE_OPTIONS: { value: MessageStatus; label: string }[] = [
  { value: 'pending', label: 'Not sent' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

export function UpdateTrackingDialog({
  open,
  onOpenChange,
  tracking,
  onSubmit,
}: Props) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState<Courier | ''>('');
  const [messageStatus, setMessageStatus] = useState<MessageStatus>('pending');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTrackingNumber(tracking.tracking_number ?? '');
    setCourier(tracking.courier ?? '');
    setMessageStatus(
      (['pending', 'sent', 'failed'] as const).find((s) => s === tracking.message_status) ??
        'pending'
    );
    setError(null);
  }, [open, tracking]);

  const handleSubmit = async () => {
    if (!courier) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(tracking.id, {
        tracking_number: trackingNumber.trim(),
        courier,
        message_status: messageStatus,
      });
      toast.success('Tracking updated');
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save tracking. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit tracking"
      description="Fix a wrong courier or tracking number."
      size="lg"
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      isSubmitting={saving}
      submitDisabled={!trackingNumber.trim() || !courier}
      error={error}
    >
      <Field label="Courier">
        <CourierPicker
          couriers={TRACKING_COURIERS}
          value={courier}
          onChange={(value) => setCourier(value as Courier)}
          disabled={saving}
        />
      </Field>

      <Field label="Tracking number" htmlFor="tracking-number">
        <Input
          id="tracking-number"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          autoComplete="off"
          className="font-mono"
          disabled={saving}
        />
      </Field>

      <Field
        label="Tracking message to customer"
        hint="Whether the WhatsApp message with this tracking number has gone out."
      >
        <ChoiceField
          label="Tracking message to customer"
          value={messageStatus}
          onChange={setMessageStatus}
          options={MESSAGE_OPTIONS}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}
