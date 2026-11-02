'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableAdAccounts, saveExtraAdAccounts } from '@/lib/api/meta-ads';
import { MetaAdsSettings } from '@/types/meta-ads';

// Other ad accounts to show on the Ads page. Only accounts picked here are
// listed there, so accounts the signed-in person can see for other businesses
// never show up in the CRM.
export function ExtraAccounts({
  settings,
  onSaved,
}: {
  settings: MetaAdsSettings;
  onSaved: (s: MetaAdsSettings) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const available = useSWR(adding ? 'meta-ad-accounts-available' : null, getAvailableAdAccounts, {
    revalidateOnFocus: false,
  });

  const extras = settings.accounts.slice(1);
  const tracked = new Set(settings.accounts.map((a) => a.id));
  const choices = (available.data ?? []).filter((a) => !tracked.has(a.id));

  const save = async (ids: string[], key: string, message: string) => {
    setSaving(key);
    try {
      onSaved(await saveExtraAdAccounts(ids));
      toast.success(message);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Couldn’t save');
      return false;
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="gap-0 py-0">
      <div className="px-5 pt-5">
        <h2 className="text-sm font-semibold">More ad accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add other ad accounts to switch between on the Ads page. {settings.account_name ?? 'The main account'} stays
          the one the dashboard and order sending use.
        </p>
      </div>

      <div className="mt-4 divide-y border-t">
        {extras.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{a.name ?? a.id}</p>
              <p className="text-xs text-muted-foreground">
                {a.id} · {a.currency}
                {a.currency !== settings.currency && ' · shown on its own, not added into ringgit totals'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1 text-muted-foreground"
              disabled={saving !== null}
              onClick={() =>
                save(
                  extras.filter((x) => x.id !== a.id).map((x) => x.id),
                  a.id,
                  `Removed ${a.name ?? a.id}`
                )
              }
            >
              {saving === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Remove
            </Button>
          </div>
        ))}

        {adding ? (
          <div className="space-y-3 px-5 py-4">
            {available.isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : available.error ? (
              <p className="flex items-start gap-1.5 text-sm text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {(available.error as Error).message}
              </p>
            ) : choices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No other ad accounts. The Facebook sign-in can only see the accounts its person has access to.
              </p>
            ) : (
              <Select value={pick} onValueChange={setPick}>
                <SelectTrigger className="w-full" aria-label="Ad account to add">
                  <SelectValue placeholder="Choose an ad account" />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={!a.active}>
                      <span className="font-medium">{a.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {a.business ? `${a.business} · ` : ''}
                        {a.currency}
                        {!a.active && ' · not active'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button
                disabled={!pick || saving !== null}
                onClick={async () => {
                  const name = choices.find((a) => a.id === pick)?.name ?? pick;
                  const ok = await save(
                    [...extras.map((x) => x.id), pick],
                    'add',
                    `Added ${name}. Pulling its last 13 months…`
                  );
                  if (ok) {
                    setPick('');
                    setAdding(false);
                  }
                }}
              >
                {saving === 'add' && <Loader2 className="h-4 w-4 animate-spin" />}
                Add account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setPick('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-3">
            <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add an ad account
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
