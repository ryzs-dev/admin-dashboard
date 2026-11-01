'use client';

import { cn } from '@/lib/utils';

// A small segmented control: as wide as its options, one selected.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex rounded-md bg-muted p-0.5 text-sm', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={disabled}
          onClick={() => value !== option.value && onChange(option.value)}
          className={cn(
            'rounded px-3 py-1.5 font-medium transition-colors disabled:opacity-50',
            value === option.value
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// One labelled setting row: label and description on the left, control on the right.
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 max-w-lg">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
