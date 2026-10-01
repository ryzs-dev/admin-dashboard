'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourierInfo } from './couriers';

export type CourierOption = CourierInfo & {
  price?: number;
  detail?: string;
  badge?: string;
};

export function CourierLogo({ courier, className }: { courier: CourierInfo; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white',
        className
      )}
    >
      {courier.logo ? (
        <Image
          src={courier.logo}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <span className="text-[11px] font-semibold text-gray-500">
          {courier.label
            .split(/[\s-]+/)
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function CourierPicker({
  couriers,
  value,
  onChange,
  disabled,
  formatPrice,
  layout = 'grid',
}: {
  couriers: CourierOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  formatPrice?: (price: number) => string;
  layout?: 'grid' | 'list';
}) {
  if (layout === 'list') {
    return (
      <div
        role="radiogroup"
        aria-label="Courier"
        className="divide-y overflow-hidden rounded-lg border bg-white"
      >
        {couriers.map((c) => {
          const active = c.code === value;
          return (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(c.code)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:opacity-60',
                active ? 'bg-primary/5' : 'hover:bg-muted/40'
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  active ? 'border-primary' : 'border-gray-300'
                )}
              >
                {active && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <CourierLogo courier={c} className="h-8 w-8" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{c.label}</span>
                  {c.badge && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-medium text-emerald-700">
                      {c.badge}
                    </span>
                  )}
                </span>
                {c.detail && (
                  <span className="block truncate text-xs text-muted-foreground">{c.detail}</span>
                )}
              </span>
              {c.price !== undefined && formatPrice && (
                <span
                  className={cn(
                    'shrink-0 text-sm tabular-nums',
                    active ? 'font-semibold text-primary' : 'font-medium'
                  )}
                >
                  {formatPrice(c.price)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Courier" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {couriers.map((c) => {
        const active = c.code === value;
        return (
          <button
            key={c.code}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(c.code)}
            className={cn(
              'relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-gray-300 hover:bg-muted/40'
            )}
          >
            <CourierLogo courier={c} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium leading-tight">{c.label}</span>
              {c.price !== undefined && formatPrice && (
                <span className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                  {formatPrice(c.price)}
                  {c.badge && (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-medium text-emerald-700">
                      {c.badge}
                    </span>
                  )}
                </span>
              )}
              {c.detail && (
                <span className="block truncate text-[11px] tabular-nums text-muted-foreground/80">
                  {c.detail}
                </span>
              )}
            </span>
            {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
