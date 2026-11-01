'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getParcelDailySettings, saveParcelDailySettings } from '@/lib/api/parcel-daily';
import { getShippingRules, saveShippingRules } from '@/lib/api/shipping';
import { useAuth } from '@/providers/auth-providers';
import { courierLabel } from '../parcel-daily/couriers';
import { CourierSelect } from './CourierSelect';
import { Segmented, SettingRow } from './Segmented';

type Tab = 'couriers' | 'cod' | 'parcel';
type SaveState = 'idle' | 'saving' | 'saved';

export function ShippingSettings({ onSaving }: { onSaving?: (state: SaveState) => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('couriers');
  const pd = useSWR('parcel-daily-settings', getParcelDailySettings, { revalidateOnFocus: false });
  const rules = useSWR('shipping-rules', getShippingRules, { revalidateOnFocus: false });
  const [kg, setKg] = useState('');

  useEffect(() => {
    if (pd.data) setKg(String(pd.data.defaults.kg));
  }, [pd.data]);

  const run = async (work: () => Promise<unknown>) => {
    onSaving?.('saving');
    try {
      await work();
      onSaving?.('saved');
      setTimeout(() => onSaving?.('idle'), 2000);
    } catch (error) {
      onSaving?.('idle');
      toast.error(error instanceof Error ? error.message : 'Couldn’t save the setting');
    }
  };

  // Primary courier, handover and weight live in Parcel Daily's settings, so the
  // Parcel Daily page and this one never disagree.
  const saveDefaults = (patch: Partial<{ courier: string; isDropoff: boolean; kg: number }>) =>
    run(async () => {
      if (!pd.data) return;
      const saved = await saveParcelDailySettings({
        pickupAddress: pd.data.pickupAddress,
        defaults: { ...pd.data.defaults, ...patch },
      });
      pd.mutate(saved, { revalidate: false });
    });

  const saveRules = (patch: Parameters<typeof saveShippingRules>[0]) =>
    run(async () => {
      const saved = await saveShippingRules({ ...patch, updated_by: user?.email ?? null });
      rules.mutate(saved, { revalidate: false });
    });

  if (!pd.data || !rules.data) {
    return pd.error || rules.error ? (
      <Card className="px-5 py-10 text-center text-sm text-muted-foreground">
        Couldn’t load the shipping settings. Check the Parcel Daily connection, then reload.
      </Card>
    ) : (
      <Skeleton className="h-64" />
    );
  }

  const defaults = pd.data.defaults;
  const r = rules.data;
  const primaryName = courierLabel(defaults.courier);

  return (
    <div className="space-y-4">
      <Segmented
        label="Shipping settings"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'couriers', label: 'Couriers' },
          { value: 'cod', label: 'COD' },
          { value: 'parcel', label: 'Pickup' },
        ]}
      />

      {tab === 'couriers' && (
        <Card className="gap-0 divide-y py-0">
          <SettingRow
            label="Primary courier"
            htmlFor="primary-courier"
            description="Used for every shipment unless a rule below applies or someone picks another courier."
          >
            <CourierSelect
              id="primary-courier"
              value={defaults.courier}
              onChange={(value) => value && saveDefaults({ courier: value })}
            />
          </SettingRow>
          <SettingRow
            label="Fallback courier"
            htmlFor="fallback-courier"
            description={`If booking with ${primaryName} fails (for example, it doesn’t serve the postcode), the shipment is tried once more with this courier.`}
          >
            <CourierSelect
              id="fallback-courier"
              value={r.fallback_courier}
              noneLabel="No fallback"
              onChange={(value) => saveRules({ fallback_courier: value })}
            />
          </SettingRow>
          <p className="px-5 py-3 text-xs text-muted-foreground">
            These apply to Autopilot and to Create Bulk Shipments on the Orders page. A single shipment created
            from an order still lets you pick any courier.
          </p>
        </Card>
      )}

      {tab === 'cod' && (
        <Card className="gap-0 divide-y py-0">
          <SettingRow
            label="Detect COD orders"
            description={
              <>
                An order is cash on delivery when the customer’s name ends with “COD”, as staff write it today
                (“Irene COD”). Its shipment collects the order total.
              </>
            }
          >
            <Switch
              checked={r.detect_cod}
              onCheckedChange={(value) => saveRules({ detect_cod: value })}
              aria-label="Detect COD orders"
            />
          </SettingRow>
          <SettingRow
            label="COD courier"
            htmlFor="cod-courier"
            description={`Not every courier collects cash. COD orders always ship with this one (now: ${r.cod_courier ? courierLabel(r.cod_courier) : primaryName}).`}
          >
            <CourierSelect
              id="cod-courier"
              value={r.cod_courier}
              noneLabel="Same as primary"
              disabled={!r.detect_cod}
              onChange={(value) => saveRules({ cod_courier: value })}
            />
          </SettingRow>
        </Card>
      )}

      {tab === 'parcel' && (
        <Card className="gap-0 divide-y py-0">
          <SettingRow label="Handover" description="Whether couriers collect parcels, or staff drop them off.">
            <Segmented
              label="Handover"
              value={defaults.isDropoff ? 'dropoff' : 'pickup'}
              onChange={(value) => saveDefaults({ isDropoff: value === 'dropoff' })}
              options={[
                { value: 'pickup', label: 'Courier pickup' },
                { value: 'dropoff', label: 'Drop-off' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Parcel weight" htmlFor="parcel-kg" description="Used for every shipment and price quote.">
            <Input
              id="parcel-kg"
              type="number"
              inputMode="decimal"
              min={0.1}
              max={30}
              step={0.1}
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              onBlur={() => {
                const value = Number(kg);
                if (!Number.isFinite(value) || value <= 0 || value > 30 || value === defaults.kg) {
                  setKg(String(defaults.kg));
                  return;
                }
                saveDefaults({ kg: Math.round(value * 100) / 100 });
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-24 text-right tabular-nums"
            />
            <span className="text-sm text-muted-foreground">kg</span>
          </SettingRow>
          <SettingRow
            label="Pickup address"
            description={`${pd.data.pickupAddress.fullName} · ${pd.data.pickupAddress.line1}, ${pd.data.pickupAddress.postcode} ${pd.data.pickupAddress.city}`}
          >
            <Link
              href="/integrations/parcel-daily"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
            >
              Edit in Parcel Daily
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </SettingRow>
        </Card>
      )}
    </div>
  );
}
