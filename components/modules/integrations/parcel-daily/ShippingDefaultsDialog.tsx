'use client';

import { useEffect, useState } from 'react';
import { Field, SegmentedChoice } from '@/components/forms/Field';
import { errorMessage, FormDialog } from '@/components/forms/FormDialog';
import { CourierPicker } from '@/components/modules/parcel-daily/CourierPicker';
import { BOOKABLE_COURIERS } from '@/components/modules/parcel-daily/couriers';
import { Input } from '@/components/ui/input';
import { ParcelDailySettings, saveParcelDailySettings } from '@/lib/api/parcel-daily';

export function ShippingDefaultsDialog({
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
  const [courier, setCourier] = useState(settings.defaults.courier);
  const [isDropoff, setIsDropoff] = useState(settings.defaults.isDropoff);
  const [kg, setKg] = useState(String(settings.defaults.kg));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCourier(settings.defaults.courier);
    setIsDropoff(settings.defaults.isDropoff);
    setKg(String(settings.defaults.kg));
    setError(null);
  }, [open, settings.defaults]);

  const weight = Number(kg);
  const weightInvalid = !(weight > 0 && weight <= 30);

  const handleSubmit = async () => {
    if (weightInvalid) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveParcelDailySettings({
        pickupAddress: settings.pickupAddress,
        defaults: { courier, isDropoff, kg: weight },
      });
      onSaved(next);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save shipping defaults'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Shipping defaults"
      description="Pre-filled when creating shipments. Staff can still change them per order."
      onSubmit={handleSubmit}
      submitLabel="Save defaults"
      isSubmitting={saving}
      submitDisabled={weightInvalid}
      error={error}
    >
      <Field
        label="Default courier"
        hint="If it doesn’t deliver to an address, the cheapest courier is picked instead."
      >
        <CourierPicker
          couriers={BOOKABLE_COURIERS.Malaysia}
          value={courier}
          onChange={setCourier}
          disabled={saving}
          layout="select"
        />
      </Field>
      <Field label="Handover">
        <SegmentedChoice
          label="Handover"
          value={isDropoff ? 'dropoff' : 'pickup'}
          onChange={(v) => setIsDropoff(v === 'dropoff')}
          options={[
            { value: 'pickup', label: 'Courier pickup' },
            { value: 'dropoff', label: 'Drop-off' },
          ]}
          disabled={saving}
        />
      </Field>
      <Field
        label="Parcel weight"
        htmlFor="pd-kg"
        hint="Used to price every shipment."
        error={weightInvalid ? 'Between 0.1 and 30 kg' : undefined}
      >
        <div className="relative max-w-40">
          <Input
            id="pd-kg"
            type="number"
            inputMode="decimal"
            min={0.1}
            max={30}
            step={0.1}
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            className="pr-10 tabular-nums"
            disabled={saving}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            kg
          </span>
        </div>
      </Field>
    </FormDialog>
  );
}
