'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Segmented } from '@/components/modules/settings/Segmented';
import { DayPicker, MonthPicker } from './PeriodPickers';
import { downloadReport, ReportRequest } from '@/lib/api/stats';
import { cn } from '@/lib/utils';

type Section = ReportRequest['sections'][number];

const SECTIONS: { id: Section; label: string; hint: string }[] = [
  { id: 'summary', label: 'Summary', hint: 'Orders, revenue, average order, new and returning customers, and ad spend with ROAS when connected' },
  { id: 'daily', label: 'Day by day', hint: 'One row per day of the month' },
  { id: 'orders', label: 'Orders', hint: 'Every order, with the columns you choose' },
  { id: 'products', label: 'Products', hint: 'Units, orders and revenue per product' },
  { id: 'new_customers', label: 'New customers', hint: 'Customers whose first order falls in the period' },
  { id: 'returning_customers', label: 'Returning customers', hint: 'Customers who had ordered before, with their order in the period' },
  { id: 'ads', label: 'Meta ads', hint: 'Spend and results for each campaign' },
];

const COLUMNS: { id: string; label: string }[] = [
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'order', label: 'Order no.' },
  { id: 'channel', label: 'Channel' },
  { id: 'type', label: 'Customer or distributor' },
  { id: 'customer', label: 'Customer' },
  { id: 'phone', label: 'Phone' },
  { id: 'address', label: 'Address' },
  { id: 'state', label: 'State' },
  { id: 'agent', label: 'Agent' },
  { id: 'items', label: 'Items' },
  { id: 'total', label: 'Total' },
  { id: 'payment', label: 'Payment' },
  { id: 'status', label: 'Status' },
  { id: 'courier', label: 'Courier' },
  { id: 'tracking', label: 'Tracking number' },
  { id: 'delivery', label: 'Delivery status' },
  { id: 'remark', label: 'Remark' },
];

const DEFAULT_SECTIONS: Section[] = ['summary', 'daily', 'orders'];
const DEFAULT_COLUMNS = ['date', 'order', 'channel', 'customer', 'phone', 'items', 'total', 'tracking'];
const STORE_KEY = 'lunaa.report-choices';

function todayInMalaysia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
}

type Saved = { sections: Section[]; columns: string[]; format: 'xlsx' | 'csv' };

function loadChoices(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function Tick({
  id,
  checked,
  onChange,
  disabled,
  children,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn('flex items-start gap-2.5 py-1.5', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
    >
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-5">{children}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function ExportDialog({ selectedMonth, adsConnected }: { selectedMonth: string; adsConnected: boolean }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<'day' | 'month'>('month');
  const [month, setMonth] = useState(selectedMonth);
  const [day, setDay] = useState(todayInMalaysia());
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = loadChoices();
    if (saved) {
      // Drop parts that no longer exist (e.g. the old parcel “Returns”).
      setSections(saved.sections.filter((id) => SECTIONS.some((s) => s.id === id)));
      setColumns(saved.columns);
      setFormat(saved.format);
    }
  }, []);

  // Opening the dialog starts from the month the dashboard is showing.
  useEffect(() => {
    if (open) {
      setMonth(selectedMonth);
      const today = todayInMalaysia();
      setDay(today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`);
    }
  }, [open, selectedMonth]);

  const available = (id: Section) => !(id === 'daily' && period === 'day') && !(id === 'ads' && !adsConnected);
  const chosen = sections.filter(available);

  const toggleSection = (id: Section, on: boolean) =>
    setSections((prev) => (on ? [...prev, id] : prev.filter((s) => s !== id)));
  const toggleColumn = (id: string, on: boolean) =>
    setColumns((prev) => (on ? COLUMNS.map((c) => c.id).filter((c) => c === id || prev.includes(c)) : prev.filter((c) => c !== id)));

  const download = async () => {
    setBusy(true);
    try {
      await downloadReport({
        period,
        month,
        date: day,
        sections: chosen,
        columns,
        format,
      });
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ sections, columns, format }));
      } catch {
        // Remembering choices is a convenience only.
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t build the report');
    } finally {
      setBusy(false);
    }
  };

  const ordersOn = chosen.includes('orders');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Export report</DialogTitle>
          <DialogDescription>Pick a day or a month, then what to put in it.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'month', label: 'Month' },
              ]}
            />
            {period === 'day' ? (
              <DayPicker value={day} max={todayInMalaysia()} onChange={setDay} />
            ) : (
              <MonthPicker value={month} max={todayInMalaysia().slice(0, 7)} onChange={setMonth} />
            )}
          </div>

          <fieldset>
            <legend className="mb-1 text-xs font-medium text-muted-foreground">Include</legend>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <Tick
                  key={s.id}
                  id={`section-${s.id}`}
                  checked={chosen.includes(s.id)}
                  disabled={!available(s.id)}
                  onChange={(on) => toggleSection(s.id, on)}
                  hint={
                    s.id === 'daily' && period === 'day'
                      ? 'Only for a month'
                      : s.id === 'ads' && !adsConnected
                        ? 'Connect Meta ads in Integrations first'
                        : s.hint
                  }
                >
                  {s.label}
                </Tick>
              ))}
            </div>
          </fieldset>

          {ordersOn && (
            <fieldset className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <legend className="text-xs font-medium text-muted-foreground">Order columns</legend>
                <div className="flex gap-3 text-xs">
                  <button type="button" className="font-medium text-muted-foreground hover:text-foreground" onClick={() => setColumns(COLUMNS.map((c) => c.id))}>
                    All
                  </button>
                  <button type="button" className="font-medium text-muted-foreground hover:text-foreground" onClick={() => setColumns(DEFAULT_COLUMNS)}>
                    Default
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
                {COLUMNS.map((c) => (
                  <Tick key={c.id} id={`col-${c.id}`} checked={columns.includes(c.id)} onChange={(on) => toggleColumn(c.id, on)}>
                    <span className="font-normal">{c.label}</span>
                  </Tick>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">File</span>
            <Segmented
              label="File type"
              value={format}
              onChange={setFormat}
              options={[
                { value: 'xlsx', label: 'Excel' },
                { value: 'csv', label: 'CSV' },
              ]}
            />
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">
            {format === 'xlsx' ? 'Each part on its own sheet.' : 'One file, parts one under another.'}
          </p>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={download} disabled={busy || chosen.length === 0 || (ordersOn && columns.length === 0)}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Preparing…' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
