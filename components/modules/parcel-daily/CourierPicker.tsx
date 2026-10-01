'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CourierOption = { value: string; label: string; logo: string };

export function CourierPicker({
  couriers,
  value,
  onChange,
  disabled,
}: {
  couriers: CourierOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Courier"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {couriers.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(c.value)}
            className={cn(
              'relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-gray-300 hover:bg-muted/40'
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
              <Image
                src={c.logo}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-contain p-1"
              />
            </span>
            <span className="text-sm font-medium leading-tight">{c.label}</span>
            {active && (
              <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
