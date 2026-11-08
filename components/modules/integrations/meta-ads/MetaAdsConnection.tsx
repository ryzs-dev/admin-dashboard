'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ChevronDown, KeyRound, Loader2, RefreshCw } from 'lucide-react';
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
import { disconnectMetaAds, facebookSignInUrl, saveMetaAdsSettings, syncMetaAds } from '@/lib/api/meta-ads';
import { cn } from '@/lib/utils';

// Password managers fill any login-looking pair of fields. These aren't a
// login, so tell Chrome, Safari, 1Password and LastPass to leave them alone.
const NO_AUTOFILL = {
  autoComplete: 'off',
  'data-1p-ignore': true,
  'data-lpignore': 'true',
  'data-form-type': 'other',
} as const;

function FacebookButton({ disabled, label = 'Continue with Facebook' }: { disabled?: boolean; label?: string }) {
  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => {
        window.location.href = facebookSignInUrl(`${window.location.origin}/integrations/meta-ads`);
      }}
      className="gap-2 bg-[#1877F2] text-white hover:bg-[#166FE5]"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
      </svg>
      {label}
    </Button>
  );
}

// The fallback: paste a system-user token by hand.
function TokenForm({
  connected,
  onSave,
}: {
  connected: boolean;
  onSave: (patch: { ad_account_id?: string; access_token: string }) => Promise<boolean>;
}) {
  const [accountId, setAccountId] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await onSave({
          ...(accountId.trim() ? { ad_account_id: accountId.trim() } : {}),
          access_token: token.trim(),
        });
        setBusy(false);
        if (ok) {
          setToken('');
          setAccountId('');
        }
      }}
      className="space-y-3"
    >
      {!connected && (
        <div className="space-y-1.5">
          <label htmlFor="meta-ad-account-id" className="text-sm font-medium">
            Ad account ID
          </label>
          <Input
            id="meta-ad-account-id"
            name="meta-ad-account-id"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="act_1234567890"
            spellCheck={false}
            disabled={busy}
            {...NO_AUTOFILL}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="meta-system-token" className="text-sm font-medium">
          System-user access token
        </label>
        {/* A text field, masked with CSS, so browsers don't offer a saved password. */}
        <Input
          id="meta-system-token"
          name="meta-system-token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="EAAG…"
          spellCheck={false}
          disabled={busy}
          className="[-webkit-text-security:disc]"
          {...NO_AUTOFILL}
        />
      </div>
      <Button type="submit" variant="outline" disabled={busy || !token.trim() || (!connected && !accountId.trim())}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? 'Checking with Meta…' : 'Save token'}
      </Button>
      <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
        <li>Business settings → Users → System users → add one.</li>
        <li>Assign assets → Ad accounts → your account → “View performance”.</li>
        <li>Generate new token → tick ads_read → Generate. It doesn’t expire.</li>
      </ol>
    </form>
  );
}

export function MetaAdsConnection() {
  const { settings, isLoading, mutate } = useMetaAdsSettings();
  const [showToken, setShowToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataset, setDataset] = useState('');

  useEffect(() => {
    if (settings) setDataset(settings.dataset_id ?? '');
  }, [settings]);

  // Coming back from Facebook: say how it went, then tidy the address bar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('meta');
    if (!result) return;
    if (result === 'error') {
      toast.error(params.get('reason') || 'Facebook sign-in didn’t finish', { duration: 20000 });
    } else if (result === 'connected') {
      toast.success('Connected to Meta. Syncing the ad numbers now.');
    }
    mutate();
    window.history.replaceState(null, '', window.location.pathname);
  }, [mutate]);

  const save = async (patch: Parameters<typeof saveMetaAdsSettings>[0]) => {
    try {
      const saved = await saveMetaAdsSettings(patch);
      mutate(saved, { revalidate: false });
      return saved;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t save');
      return null;
    }
  };

  if (isLoading || !settings) return <Skeleton className="h-72" />;
  const s = settings;

  const expires = s.token_expires_at ? new Date(s.token_expires_at) : null;
  const expiresSoon = expires && expires.getTime() - Date.now() < 7 * 86400000;

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold">Ad account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reads spend and results for every campaign each hour, so the dashboard can show ad spend and ROAS next
            to your sales. Read-only: nothing in Ads Manager is changed.
          </p>
        </div>

        <div className="mt-4 divide-y border-t">
          {!s.connected ? (
            <div className="space-y-3 px-5 py-5">
              <FacebookButton disabled={!s.login_available} />
              <p className="text-xs text-muted-foreground">
                {s.login_available
                  ? 'Sign in with a Facebook account that can see Lunaa’s ad account. You can add more accounts on the Ads page.'
                  : 'Facebook sign-in isn’t switched on for this CRM yet. Use an access token for now.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.account_name ?? s.ad_account_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.ad_account_id} · {s.currency} · {s.timezone}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.connected_via === 'facebook'
                      ? `Connected with Facebook${s.connected_by ? ` by ${s.connected_by}` : ''}`
                      : 'Connected with an access token'}
                    {s.connected_at && ` · ${format(new Date(s.connected_at), 'd MMM yyyy')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    {s.token_hint}
                  </span>
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
                          The saved token and the ad numbers pulled into the CRM are removed, and orders stop being
                          sent to Meta. Your ad account itself isn’t touched.
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

              {expires && (
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 px-5 py-4',
                    expiresSoon && 'bg-amber-50/60'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {expires.getTime() < Date.now() ? 'Sign-in expired' : `Sign-in lasts until ${format(expires, 'd MMM yyyy')}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Facebook sign-ins last 60 days. Sign in again before then to keep the numbers coming.
                    </p>
                  </div>
                  {s.login_available && <FacebookButton label="Sign in again" />}
                </div>
              )}

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
                        : 'Pulling the last 13 months…'}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncing}
                  onClick={async () => {
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
                  }}
                >
                  <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                  {syncing ? 'Syncing…' : 'Sync now'}
                </Button>
              </div>

              {s.currency && s.currency !== 'MYR' && (
                <p className="flex items-start gap-1.5 px-5 py-3 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This ad account spends in {s.currency}, but sales are in RM, so ROAS mixes two currencies.
                </p>
              )}
            </>
          )}

          {/* Pasting a token by hand stays available, tucked away. */}
          <div className="px-5 py-3">
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-expanded={showToken}
            >
              {s.connected ? 'Replace with a system-user token' : 'Use a system-user token instead'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showToken && 'rotate-180')} />
            </button>
            {showToken && (
              <div className="pt-3">
                <TokenForm
                  connected={s.connected}
                  onSave={async (patch) => {
                    const saved = await save(patch);
                    if (saved) {
                      toast.success(`Connected to ${saved.account_name ?? saved.ad_account_id}`);
                      setShowToken(false);
                      setTimeout(() => mutate(), 8000);
                    }
                    return Boolean(saved);
                  }}
                />
              </div>
            )}
          </div>
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
                <p className="text-xs text-muted-foreground">Events Manager → your dataset (pixel) → Settings.</p>
              </div>
              <Input
                id="meta-dataset"
                name="meta-dataset"
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
                {...NO_AUTOFILL}
              />
            </div>
            {s.send_conversions && (
              <div className="px-5 py-4">
                <p className="text-sm font-medium">{s.conversions_sent_7d.toLocaleString()} orders sent in the last 7 days</p>
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
