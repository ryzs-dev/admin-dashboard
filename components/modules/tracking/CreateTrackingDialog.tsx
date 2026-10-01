'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { FormDialog, errorMessage } from '@/components/forms/FormDialog';
import { Field, SegmentedChoice } from '@/components/forms/Field';
import { CourierPicker } from '../parcel-daily/CourierPicker';
import { TRACKING_COURIERS } from '../parcel-daily/constants';
import { OrderTrackingInput } from './types';
import { Courier } from './UpdateTrackingDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OrderTrackingInput) => Promise<void>;
}

const STATUS_OPTIONS: { value: OrderTrackingInput['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
];

export function CreateTrackingDialog({ open, onOpenChange, onSubmit }: Props) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState<Courier | ''>('');
  const [status, setStatus] = useState<OrderTrackingInput['status']>('pending');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTrackingNumber('');
    setCourier('');
    setStatus('pending');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        tracking_number: trackingNumber.trim(),
        courier: courier as Courier,
        status,
      });
      toast.success('Tracking added');
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t add tracking. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add tracking manually"
      description="For parcels booked outside the dashboard, e.g. at a courier counter."
      size="lg"
      onSubmit={handleSubmit}
      submitLabel="Add tracking"
      isSubmitting={saving}
      submitDisabled={!trackingNumber.trim() || !courier}
      error={error}
      footerNote={!courier ? 'Choose a courier to continue' : undefined}
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
          placeholder="e.g. MY0612345678"
          autoComplete="off"
          className="font-mono"
          disabled={saving}
        />
      </Field>

      <Field label="Delivery status">
        <SegmentedChoice
          label="Delivery status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}
