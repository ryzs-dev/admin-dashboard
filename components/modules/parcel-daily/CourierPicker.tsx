'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { CourierInfo } from './couriers';

export type CourierOption = CourierInfo & {
  price?: number;
  detail?: string;
  badge?: string;
};

export function CourierLogo({
  courier,
  className,
}: {
  courier: CourierInfo;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white',
        className
      )}
    >
      {courier.logo ? (
        <Image
          src={courier.logo}
          alt=""
          width={112}
          height={72}
          className="h-full w-full object-contain px-1.5 py-1"
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

function CourierRow({
  courier,
  formatPrice,
  active,
}: {
  courier: CourierOption;
  formatPrice?: (price: number) => string;
  active?: boolean;
}) {
  return (
    <span className="flex w-full min-w-0 items-center gap-3 text-left">
      <CourierLogo courier={courier} className="h-8 w-16" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {courier.label}
          </span>
          {courier.badge && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-medium text-emerald-700">
              {courier.badge}
            </span>
          )}
        </span>
        {courier.detail && (
          <span className="block truncate text-xs text-muted-foreground">
            {courier.detail}
          </span>
        )}
      </span>
      {courier.price !== undefined && formatPrice && (
        <span
          className={cn(
            'shrink-0 text-sm tabular-nums',
            active
              ? 'font-semibold text-primary'
              : 'font-medium text-foreground'
          )}
        >
          {formatPrice(courier.price)}
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
}: {
  couriers: CourierOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  formatPrice?: (price: number) => string;
}) {
  const selected = couriers.find((c) => c.code === value);
  return (
    <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label="Courier"
        className="h-auto w-full bg-white py-2 pl-2 pr-3 data-[size=default]:h-auto"
      >
        {selected ? (
          <CourierRow courier={selected} formatPrice={formatPrice} active />
        ) : (
          <span className="px-1 text-muted-foreground">Choose a courier</span>
        )}
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {couriers.map((c) => (
          <SelectItem
            key={c.code}
            value={c.code}
            textValue={c.label}
            className="py-2 pl-2 pr-8 *:[span]:last:flex-1 *:[span]:last:min-w-0"
          >
            <CourierRow
              courier={c}
              formatPrice={formatPrice}
              active={c.code === value}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
