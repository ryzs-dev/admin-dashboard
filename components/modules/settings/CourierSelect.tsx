'use client';

import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BOOKABLE_COURIERS, CourierInfo, courierInfo } from '../parcel-daily/couriers';

const NONE = '__none__';

function CourierOption({ courier }: { courier: CourierInfo }) {
  return (
    <span className="flex items-center gap-2">
      {courier.logo ? (
        <Image src={courier.logo} alt="" width={20} height={20} className="h-5 w-5 rounded object-contain" />
      ) : (
        <span className="h-5 w-5 rounded bg-muted" />
      )}
      {courier.label}
    </span>
  );
}

// Courier dropdown in Parcel Daily codes. `noneLabel` adds an empty choice
// ("No fallback", "Same as primary") that saves as null.
export function CourierSelect({
  id,
  value,
  onChange,
  noneLabel,
  disabled,
}: {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  noneLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(next) => onChange(next === NONE ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-60">
        <SelectValue>
          {value ? <CourierOption courier={courierInfo(value)} /> : noneLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {noneLabel && (
          <>
            <SelectItem value={NONE}>{noneLabel}</SelectItem>
            <SelectSeparator />
          </>
        )}
        {(['Malaysia', 'Singapore'] as const).map((country) => (
          <SelectGroup key={country}>
            <SelectLabel>{country}</SelectLabel>
            {BOOKABLE_COURIERS[country]
              // Couriers serving both countries are listed once, under Malaysia.
              .filter(
                (courier) =>
                  country === 'Malaysia' ||
                  !BOOKABLE_COURIERS.Malaysia.some((my) => my.code === courier.code)
              )
              .map((courier) => (
              <SelectItem key={`${country}-${courier.code}`} value={courier.code}>
                <CourierOption courier={courier} />
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
