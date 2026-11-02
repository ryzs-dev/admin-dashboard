'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMetaAdsSettings } from '@/hooks/useMetaAds';
import { disconnectMetaAds, saveMetaAdsSettings, syncMetaAds } from '@/lib/api/meta-ads';

type SaveState = 'saving' | 'saved' | 'idle';

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export function MetaAdsSettingsSection({ onSaving }: { onSaving?: (state: SaveState) => void }) {
  const { settings, isLoading, mutate } = useMetaAdsSettings();
  const [accountId, setAccountId] = useState('');
  const [token, setToken] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataset, setDataset] = useState('');

  useEffect(() => {
    if (settings) setDataset(settings.dataset_id ?? '');
  }, [settings]);

  const save = async (patch: Parameters<typeof saveMetaAdsSettings>[0]) => {
    onSaving?.('saving');
    try {
      const saved = await saveMetaAdsSettings(patch);
      mutate(saved, { revalidate: false });
      onSaving?.('saved');
      setTimeout(() => onSaving?.('idle'), 2000);
      return saved;
    } catch (error) {
      onSaving?.('idle');
      toast.error(error instanceof Error ? error.message : 'Couldn’t save');
      return null;
    }
  };

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    const saved = await save({
      ...(accountId.trim() ? { ad_account_id: accountId.trim() } : {}),
      access_token: token.trim(),
    });
    setConnecting(false);
    if (saved) {
      setToken('');
      setAccountId('');
      setReplacing(false);
      toast.success(`Connected to ${saved.account_name ?? saved.ad_account_id}. Pulling the last 90 days…`);
      // The backfill runs on the server; check back once it has had a moment.
      setTimeout(() => mutate(), 8000);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      mutate(await syncMetaAds(), { revalidate: false });
      toast.success('Synced with Meta');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t sync');
      mutate();
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading || !settings) return <Skeleton className="h-72" />;
  const s = settings;
  const showForm = !s.connected || replacing;

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold">Ad account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reads spend and results for every campaign each hour, so the dashboard can show ad spend and ROAS
            next to your sales. Read-only: nothing in Ads Manager is changed.
          </p>
        </div>

        <div className="mt-4 divide-y border-t">
          {s.connected && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.account_name ?? s.ad_account_id}</p>
                <p className="text-xs text-muted-foreground">
                  {s.ad_account_id} · {s.currency} · {s.timezone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.token_hint}
                </span>
                {!replacing && (
                  <Button variant="outline" size="sm" onClick={() => setReplacing(true)}>
                    Replace token
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Meta ads?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The saved token and the ad numbers pulled into the CRM are removed, and orders stop being sent
                        to Meta. Your ad account itself isn’t touched.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep connected</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            mutate(await disconnectMetaAds(), { revalidate: false });
                            toast.success('Disconnected');
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Couldn’t disconnect');
                          }
                        }}
                      >
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {s.connected && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Last synced</p>
                {s.last_sync_error ? (
                  <p className="flex items-start gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {s.last_sync_error}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {s.last_sync_at
                      ? `${formatDistanceToNow(new Date(s.last_sync_at))} ago · syncs every hour`
                      : 'Pulling the last 90 days…'}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={syncNow} disabled={syncing}>
                <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </Button>
            </div>
          )}

          {s.connected && s.currency && s.currency !== 'MYR' && (
            <p className="flex items-start gap-1.5 px-5 py-3 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This ad account spends in {s.currency}, but sales are in RM, so ROAS mixes two currencies. Use an
              account billed in MYR for an exact figure.
            </p>
          )}

          {showForm && (
            <form onSubmit={connect} className="space-y-3 px-5 py-4">
              {!s.connected && (
                <div className="space-y-1.5">
                  <label htmlFor="meta-account" className="text-sm font-medium">
                    Ad account ID
                  </label>
                  <Input
                    id="meta-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="act_1234567890"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={connecting}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="meta-token" className="text-sm font-medium">
                  Access token
                </label>
                <Input
                  id="meta-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="EAAG…"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={connecting}
                />
                <p className="text-xs text-muted-foreground">
                  Checked with Meta before saving. Stored encrypted on the server and never shown again.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={connecting || !token.trim() || (!s.connected && !accountId.trim())}
                >
                  {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {connecting ? 'Checking with Meta…' : s.connected ? 'Save token' : 'Connect'}
                </Button>
                {replacing && (
                  <Button type="button" variant="ghost" onClick={() => setReplacing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
              {!s.connected && (
                <div className="rounded-md bg-muted/60 p-3">
                  <p className="mb-1.5 text-xs font-medium">Where to get these</p>
                  <Steps
                    items={[
                      'Ad account ID: Ads Manager → the account name at the top left (the number after act_).',
                      'Business settings → Users → System users → add one (or use an existing one).',
                      'Assign assets → Ad accounts → your account → “View performance”.',
                      'Generate new token → pick your app → tick ads_read → Generate. A system-user token doesn’t expire.',
                    ]}
                  />
                </div>
              )}
            </form>
          )}
        </div>
      </Card>

      {s.connected && (
        <Card className="gap-0 py-0">
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Send orders to Meta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each new WhatsApp order goes to Meta with the order value and the customer’s phone number,
                scrambled before it leaves the CRM. Meta matches it to people who saw or clicked your ads, so Ads
                Manager can show purchases and ROAS for each campaign. Distributor and Shopee/Lazada orders aren’t
                sent.
              </p>
            </div>
            <Switch
              checked={s.send_conversions}
              disabled={!s.dataset_id}
              onCheckedChange={(value) => save({ send_conversions: value })}
              aria-label="Send orders to Meta"
            />
          </div>

          <div className="mt-4 divide-y border-t">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 max-w-lg">
                <label htmlFor="meta-dataset" className="text-sm font-medium">
                  Dataset ID
                </label>
                <p className="text-xs text-muted-foreground">
                  Events Manager → your dataset (pixel) → Settings. The system user needs access to it too.
                </p>
              </div>
              <Input
                id="meta-dataset"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                onBlur={() => {
                  const value = dataset.trim();
                  if (value === (s.dataset_id ?? '')) return;
                  save({ dataset_id: value || null }).then((saved) => {
                    if (!saved) setDataset(s.dataset_id ?? '');
                  });
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                placeholder="1234567890"
                inputMode="numeric"
                className="w-full sm:w-60"
              />
            </div>

            {s.send_conversions && (
              <div className="px-5 py-4">
                <p className="text-sm font-medium">
                  {s.conversions_sent_7d.toLocaleString()} orders sent in the last 7 days
                </p>
                {s.last_conversion_error ? (
                  <p className="mt-0.5 flex items-start gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Last problem: {s.last_conversion_error}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    New orders go every 10 minutes. Meta takes a day or two to show them in Ads Manager.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
