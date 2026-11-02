'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { Panel } from '@/components/dashboard/Panel';
import { SalesReport } from '@/types/sales-report';
import { saveSalesTarget } from '@/lib/api/sales-report';

export const pct = (n: number | null | undefined) => (n == null ? '—' : `${n.toFixed(2)}%`);
export const roasText = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(2));

function Cell({
  label,
  value,
  lead,
  tone,
  isLoading,
  children,
}: {
  label: string;
  value: string;
  lead?: boolean;
  tone?: 'good' | 'bad' | null;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className={cn('mt-1.5', lead ? 'h-8 w-40' : 'h-6 w-24')} />
      ) : (
        <p
          className={cn(
            'mt-1 truncate tabular-nums tracking-tight text-foreground',
            lead ? 'text-2xl font-bold leading-8 sm:text-[30px] sm:leading-9' : 'text-2xl font-medium leading-8',
            tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
            tone === 'bad' && 'text-red-600 dark:text-red-400'
          )}
        >
          {value}
        </p>
      )}
      <div className="mt-1 text-xs text-muted-foreground">{children}</div>
    </div>
  );
}

function TargetCell({
  report,
  isLoading,
  onSaved,
}: {
  report?: SalesReport;
  isLoading?: boolean;
  onSaved: (r: SalesReport) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [report?.month]);

  const start = () => {
    setValue(report?.target != null ? String(report.target) : '');
    setEditing(true);
  };

  const save = async () => {
    if (!report) return;
    const clean = value.replace(/[,\sRMrm]/g, '');
    const target = clean === '' ? null : Number(clean);
    if (target != null && (!Number.isFinite(target) || target < 0)) {
      toast.error('Enter the target in ringgit, like 200000');
      return;
    }
    setSaving(true);
    try {
      onSaved(await saveSalesTarget(report.month, target));
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Couldn’t save the target');
    } finally {
      setSaving(false);
    }
  };

  const target = report?.target ?? null;
  const progress = target && report ? Math.min(100, (report.totals.sales / target) * 100) : 0;

  return (
    <div className="min-w-0 px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Target sales</p>
        {!editing && report && (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            {target == null ? 'Set' : 'Edit'}
          </button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="mt-1.5 h-6 w-24" />
      ) : editing ? (
        <form
          className="mt-1 flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="200000"
            className="h-8 tabular-nums"
            aria-label="Target sales in ringgit"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={saving} aria-label="Save target">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setEditing(false)}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <p className="mt-1 truncate text-2xl font-medium leading-8 tabular-nums tracking-tight text-foreground">
          {target == null ? '—' : formatCurrency(target)}
        </p>
      )}
      <div className="mt-1 text-xs text-muted-foreground">
        {target == null || !report ? (
          'No target set for this month'
        ) : report.to_pick_up ? (
          <>
            {formatCurrency(report.to_pick_up)} to pick up
            {report.sales_per_day_needed != null &&
              ` · ${formatCurrency(report.sales_per_day_needed)} a day for ${report.days_left} day${report.days_left === 1 ? '' : 's'}`}
          </>
        ) : (
          'Target reached'
        )}
      </div>
      {target != null && report && !editing && (
        <div className="mt-2 h-1 w-full rounded-full bg-muted">
          <div className="h-1 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export function ReportSummary({
  report,
  isLoading,
  onSaved,
}: {
  report?: SalesReport;
  isLoading?: boolean;
  onSaved: (r: SalesReport) => void;
}) {
  const t = report?.totals;
  const roas = t?.roas ?? null;

  return (
    <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4 [&>*]:bg-card">
      <Cell label="Total sales" value={formatCurrency(t?.sales ?? 0)} lead isLoading={isLoading}>
        {t ? `${t.orders.toLocaleString()} orders · WhatsApp ${formatCurrency(t.wa_sales)} · Shopee/LZD ${formatCurrency(t.mp_sales)}` : ' '}
      </Cell>
      <TargetCell report={report} isLoading={isLoading} onSaved={onSaved} />
      <Cell label="Total ad spent" value={formatCurrency(t?.ad_spend ?? 0)} isLoading={isLoading}>
        {t?.messages ? `${t.messages.toLocaleString()} messages · ${formatCurrency(t.cost_per_message ?? 0)} each` : report?.ad_account ? 'No ad spend this month' : 'Meta ads not connected'}
      </Cell>
      <Cell
        label="ROAS"
        value={roasText(roas)}
        tone={roas == null ? null : roas >= 2 ? 'good' : 'bad'}
        isLoading={isLoading}
      >
        All sales ÷ ad spend
      </Cell>
      <Cell label="Repeat order" value={pct(t?.repeat_pct)} isLoading={isLoading}>
        {t ? `${t.wa_repeat} of ${t.wa_orders} WhatsApp orders` : ' '}
      </Cell>
      <Cell label="Shopee/LZD repeat" value={pct(t?.mp_repeat_pct)} isLoading={isLoading}>
        {t ? `${t.mp_repeat} of ${t.marketplace_orders} marketplace orders` : ' '}
      </Cell>
      <Cell label="AOV" value={t?.aov == null ? '—' : formatCurrency(t.aov)} isLoading={isLoading}>
        All sales ÷ all orders
      </Cell>
      <Cell label="Closing rate" value={pct(t?.conversion_rate)} isLoading={isLoading}>
        {t?.messages ? `${t.wa_new} new orders from ${t.messages.toLocaleString()} messages` : 'New WhatsApp orders ÷ messages'}
      </Cell>
    </Panel>
  );
}
