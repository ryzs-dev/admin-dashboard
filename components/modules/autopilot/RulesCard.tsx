'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AutopilotSettings } from '@/types/autopilot';

type NumberField = 'lookback_days' | 'max_orders_per_run' | 'min_credit';

const NUMBER_RULES: {
  field: NumberField;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}[] = [
  {
    field: 'lookback_days',
    label: 'Only orders from the last',
    hint: 'Older orders are left for staff, so switching Autopilot on never works through a backlog.',
    min: 1,
    max: 30,
    step: 1,
    suffix: 'days',
  },
  {
    field: 'max_orders_per_run',
    label: 'At most',
    hint: 'Anything over this waits for the next run.',
    min: 1,
    max: 500,
    step: 1,
    suffix: 'orders per run',
  },
  {
    field: 'min_credit',
    label: 'Stop shipping below',
    hint: 'Parcel Daily credit needed before a shipping run starts.',
    min: 0,
    max: 100000,
    step: 10,
    prefix: 'RM',
  },
];

export function RulesCard({
  settings,
  onSave,
}: {
  settings: AutopilotSettings;
  onSave: (patch: Partial<AutopilotSettings>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<NumberField, string>>({
    lookback_days: String(settings.lookback_days),
    max_orders_per_run: String(settings.max_orders_per_run),
    min_credit: String(settings.min_credit),
  });

  useEffect(() => {
    setValues({
      lookback_days: String(settings.lookback_days),
      max_orders_per_run: String(settings.max_orders_per_run),
      min_credit: String(settings.min_credit),
    });
  }, [settings]);

  const commit = (field: NumberField, rule: (typeof NUMBER_RULES)[number]) => {
    const value = Number(values[field]);
    if (!Number.isFinite(value) || value === settings[field]) {
      setValues((v) => ({ ...v, [field]: String(settings[field]) }));
      return;
    }
    const clamped = Math.min(rule.max, Math.max(rule.min, field === 'min_credit' ? value : Math.round(value)));
    onSave({ [field]: clamped });
  };

  return (
    <Card className="gap-0 py-0">
      <div className="px-5 pt-5">
        <h2 className="text-sm font-semibold">Rules</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Apply to both steps. Marketplace orders (Shopee, Lazada) are never touched, and any order can be held
          from its menu on the Orders page.
        </p>
      </div>

      <div className="mt-4 divide-y border-t">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-medium">Include distributor orders</p>
            <p className="text-xs text-muted-foreground">Off: distributor orders stay manual.</p>
          </div>
          <Switch
            checked={settings.include_distributors}
            onCheckedChange={(value) => onSave({ include_distributors: value })}
            aria-label="Include distributor orders"
          />
        </div>

        {NUMBER_RULES.map((rule) => (
          <div key={rule.field} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0 max-w-md">
              <label htmlFor={`rule-${rule.field}`} className="text-sm font-medium">
                {rule.label}
              </label>
              <p className="text-xs text-muted-foreground">{rule.hint}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {rule.prefix}
              <Input
                id={`rule-${rule.field}`}
                type="number"
                inputMode="numeric"
                min={rule.min}
                max={rule.max}
                step={rule.step}
                value={values[rule.field]}
                onChange={(e) => setValues((v) => ({ ...v, [rule.field]: e.target.value }))}
                onBlur={() => commit(rule.field, rule)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 text-right tabular-nums text-foreground"
              />
              {rule.suffix}
            </div>
          </div>
        ))}

        <div className="px-5 py-4 text-xs text-muted-foreground">
          Courier, pickup or drop-off and parcel weight come from{' '}
          <Link href="/integrations/parcel-daily" className="font-medium text-foreground underline-offset-2 hover:underline">
            Parcel Daily settings
          </Link>
          .
        </div>
      </div>
    </Card>
  );
}
