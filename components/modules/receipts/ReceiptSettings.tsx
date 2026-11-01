'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getReceiptSettings, saveReceiptSettings } from '@/lib/api/receipts';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-providers';
import { ReceiptModel, ReceiptSettings as Settings } from '@/types/receipt';

// Approximate cost per receipt, from a phone screenshot (~1,900 input tokens)
// and a short reply. The Settings page shows the real spend beside it.
const MODELS: { value: ReceiptModel; label: string; note: string }[] = [
  { value: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Most careful · about US$0.02 a receipt' },
  { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'About US$0.01 a receipt' },
  { value: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', note: 'Cheapest · under US$0.001 a receipt' },
];

const usd = (n: number) => `US$${n.toFixed(2)}`;

export function ReceiptSettingsSection({
  onSaving,
}: {
  onSaving?: (state: 'saving' | 'saved' | 'idle') => void;
}) {
  const { user } = useAuth();
  const { data: settings, isLoading, mutate } = useSWR('receipt-settings', getReceiptSettings, {
    revalidateOnFocus: false,
  });
  const [key, setKey] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [cap, setCap] = useState('');

  useEffect(() => {
    if (settings) setCap(String(settings.monthly_cap_usd));
  }, [settings]);

  const save = async (patch: Parameters<typeof saveReceiptSettings>[0]) => {
    onSaving?.('saving');
    try {
      const saved = await saveReceiptSettings({ ...patch, updated_by: user?.email ?? null });
      mutate(saved, { revalidate: false });
      onSaving?.('saved');
      setTimeout(() => onSaving?.('idle'), 2000);
      return saved;
    } catch (error) {
      onSaving?.('idle');
      toast.error(error instanceof Error ? error.message : 'Couldn’t save the setting');
      return null;
    }
  };

  const saveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setSavingKey(true);
    const saved = await save({ api_key: key.trim() });
    setSavingKey(false);
    if (saved) {
      setKey('');
      setReplacing(false);
      toast.success('Key checked with Anthropic and saved');
    }
  };

  if (isLoading || !settings) return <Skeleton className="h-72" />;

  const s: Settings = settings;
  const used = s.monthly_cap_usd > 0 ? Math.min(s.month.cost_usd / s.monthly_cap_usd, 1) : 1;

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Read receipts with AI</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Claude reads the amount, date and reference on each receipt staff send with an order, and flags
            receipts that don’t match the order total. Receipts are always saved, read or not.
          </p>
        </div>
        <Switch
          checked={s.enabled}
          onCheckedChange={(value) => save({ enabled: value })}
          aria-label="Read receipts with AI"
        />
      </div>

      <div className="mt-4 divide-y border-t">
        {/* Anthropic key */}
        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Anthropic API key</p>
              <p className="text-xs text-muted-foreground">
                Billed to your own Anthropic account. Stored encrypted on the server and never shown again.
              </p>
            </div>
            {s.has_key && !replacing && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.key_hint}
                </span>
                <Button variant="outline" size="sm" onClick={() => setReplacing(true)}>
                  Replace
                </Button>
                {s.key_hint !== 'Set on the server' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-red-600"
                    onClick={() => save({ clear_key: true })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>

          {(!s.has_key || replacing) && (
            <form onSubmit={saveKey} className="flex flex-wrap gap-2">
              <Input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
                spellCheck={false}
                aria-label="Anthropic API key"
                className="min-w-0 flex-1"
                disabled={savingKey}
              />
              <Button type="submit" disabled={savingKey || !key.trim()}>
                {savingKey && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingKey ? 'Checking…' : 'Save key'}
              </Button>
              {replacing && (
                <Button type="button" variant="ghost" onClick={() => setReplacing(false)}>
                  Cancel
                </Button>
              )}
            </form>
          )}
          {!s.has_key && (
            <p className="text-xs text-muted-foreground">
              Create one at console.anthropic.com → API keys. Set a spend limit there too.
            </p>
          )}
        </div>

        {/* Model */}
        <div className="space-y-2 px-5 py-4">
          <p className="text-sm font-medium">Model</p>
          <div role="radiogroup" aria-label="Model" className="grid gap-2 sm:grid-cols-3">
            {MODELS.map((model) => (
              <button
                key={model.value}
                type="button"
                role="radio"
                aria-checked={s.model === model.value}
                onClick={() => s.model !== model.value && save({ model: model.value })}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-left transition-colors',
                  s.model === model.value ? 'border-[#662d91] ring-1 ring-[#662d91]' : 'hover:border-gray-300'
                )}
              >
                <p className="text-sm font-medium">{model.label}</p>
                <p className="text-xs text-muted-foreground">{model.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly limit and spend */}
        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 max-w-md">
              <label htmlFor="receipt-cap" className="text-sm font-medium">
                Stop reading after
              </label>
              <p className="text-xs text-muted-foreground">
                Spend a month. Receipts are still saved after this, just not read until the 1st.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              US$
              <Input
                id="receipt-cap"
                type="number"
                inputMode="decimal"
                min={0}
                max={1000}
                step={1}
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                onBlur={() => {
                  const value = Number(cap);
                  if (!Number.isFinite(value) || value === s.monthly_cap_usd) {
                    setCap(String(s.monthly_cap_usd));
                    return;
                  }
                  save({ monthly_cap_usd: Math.min(1000, Math.max(0, value)) });
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 text-right tabular-nums text-foreground"
              />
              a month
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">
                This month: <span className="font-medium text-foreground tabular-nums">{s.month.receipts_read}</span>{' '}
                {s.month.receipts_read === 1 ? 'receipt' : 'receipts'} read
              </span>
              <span className="tabular-nums">
                <span className="font-medium">{usd(s.month.cost_usd)}</span>
                <span className="text-muted-foreground"> of {usd(s.monthly_cap_usd)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', used >= 1 ? 'bg-[#c4242a]' : 'bg-[#662d91]')}
                style={{ width: `${used * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
