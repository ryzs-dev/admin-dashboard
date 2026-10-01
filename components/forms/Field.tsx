import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-sm font-medium">
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        RM
      </span>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn('pl-10 tabular-nums', invalid && 'border-red-300')}
      />
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const set = (next: number) => onChange(Math.max(1, Math.min(999, next || 1)));
  return (
    <div className="inline-flex h-9 items-center rounded-md border bg-background">
      <button
        type="button"
        aria-label={`Decrease ${label ?? 'quantity'}`}
        disabled={disabled || value <= 1}
        onClick={() => set(value - 1)}
        className="flex h-full w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min={1}
        aria-label={label ?? 'Quantity'}
        value={value}
        disabled={disabled}
        onChange={(e) => set(parseInt(e.target.value, 10))}
        className="h-full w-10 border-x bg-transparent text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`Increase ${label ?? 'quantity'}`}
        disabled={disabled}
        onClick={() => set(value + 1)}
        className="flex h-full w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export type ChoiceOption<T extends string> = { value: T; label: string; hint?: string };

// Radio buttons for short lists; a dropdown once there are too many to scan in a row.
export function ChoiceField<T extends string>({
  value,
  onChange,
  options,
  disabled,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  disabled?: boolean;
  label: string;
}) {
  if (options.length > 3) {
    return (
      <Select value={value} onValueChange={(next) => onChange(next as T)} disabled={disabled}>
        <SelectTrigger aria-label={label} className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const withHints = options.some((option) => option.hint);
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      className={withHints ? 'gap-3' : 'flex flex-wrap gap-x-6 gap-y-2'}
    >
      {options.map((option) => {
        const id = `${label}-${option.value}`.replace(/\W+/g, '-').toLowerCase();
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              'flex cursor-pointer gap-2.5 text-sm',
              withHints ? 'items-start' : 'items-center',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <RadioGroupItem id={id} value={option.value} className={withHints ? 'mt-0.5' : undefined} />
            <span>
              <span className="block">{option.label}</span>
              {option.hint && (
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              )}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
