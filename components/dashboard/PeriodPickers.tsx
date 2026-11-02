'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function Trigger({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <PopoverTrigger asChild>
      <Button variant="outline" aria-label={label} className="w-44 justify-between font-normal">
        {children}
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
  );
}

// value and max are YYYY-MM.
export function MonthPicker({
  value,
  max,
  onChange,
}: {
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const maxYear = Number(max.slice(0, 4));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setYear(Number(value.slice(0, 4)));
      }}
    >
      <Trigger label="Month">{format(parseISO(`${value}-01`), 'MMMM yyyy')}</Trigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous year" onClick={() => setYear(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Next year"
            disabled={year >= maxYear}
            onClick={() => setYear(year + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((name, i) => {
            const key = `${year}-${String(i + 1).padStart(2, '0')}`;
            const selected = key === value;
            return (
              <button
                key={key}
                type="button"
                disabled={key > max}
                aria-pressed={selected}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  'rounded-md py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-35',
                  selected
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none'
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// value and max are YYYY-MM-DD.
export function DayPicker({
  value,
  max,
  onChange,
}: {
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger label="Day">{format(selected, 'EEE d MMM yyyy')}</Trigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={{ after: parseISO(max) }}
          weekStartsOn={1}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, 'yyyy-MM-dd'));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
