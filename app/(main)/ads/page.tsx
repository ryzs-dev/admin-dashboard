'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronRight, ExternalLink, Loader2, Megaphone } from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/components/dashboard/Panel';
import { MonthPicker } from '@/components/dashboard/PeriodPickers';
import { Segmented } from '@/components/modules/settings/Segmented';
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
import { AdsSummary } from '@/components/ads/AdsSummary';
import { SpendChart } from '@/components/ads/SpendChart';
import { CampaignTable } from '@/components/ads/CampaignTable';
import { PeriodTable } from '@/components/ads/PeriodTable';
import {
  RANGE_OPTIONS,
  RangeKind,
  adMoney,
  bucketDays,
  comparable,
  rangeFor,
  rangeLabel,
  ratio,
  times,
  todayInMalaysia,
} from '@/components/ads/period';
import { useMetaAdsReport, useMetaAdsSettings } from '@/hooks/useMetaAds';
import { addAdAccount, getAvailableAdAccounts } from '@/lib/api/meta-ads';
import { formatCurrency } from '@/lib/utils/currency';

export default function AdsPage() {
  const today = todayInMalaysia();
  const [kind, setKind] = useState<RangeKind>('month');
  const [month, setMonth] = useState(today.slice(0, 7));

  // '' means the main account until the settings arrive.
  const [account, setAccount] = useState('');
  const [switching, setSwitching] = useState(false);
  const [polling, setPolling] = useState(false);

  const { settings, isLoading: settingsLoading, mutate } = useMetaAdsSettings(polling ? 4000 : 0);
  const connected = Boolean(settings?.connected);
  const tracked = useMemo(() => settings?.accounts ?? [], [settings?.accounts]);
  const available = useSWR(connected ? 'meta-ad-accounts-available' : null, getAvailableAdAccounts, {
    revalidateOnFocus: false,
  });

  // Remember the account per browser.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ads-account');
      if (saved) setAccount(saved);
    } catch {}
  }, []);

  // Every account the sign-in can see, the main one first; plus any synced
  // account the sign-in has since lost access to.
  const options = useMemo(() => {
    const main = settings?.ad_account_id;
    const list = (available.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      business: a.business,
      active: a.active,
    }));
    for (const t of tracked) {
      if (!list.some((a) => a.id === t.id)) {
        list.push({ id: t.id, name: t.name ?? t.id, currency: t.currency ?? '', business: null, active: true });
      }
    }
    return list.sort((x, y) => (x.id === main ? -1 : y.id === main ? 1 : 0));
  }, [available.data, tracked, settings?.ad_account_id]);

  // Lunaa's own accounts first, then everything else the sign-in can see,
  // then the closed or disabled ones.
  const groups = useMemo(() => {
    const isLunaa = (a: (typeof options)[number]) =>
      a.id === settings?.ad_account_id || tracked.some((t) => t.id === a.id) || /lunaa/i.test(a.name);
    const byName = (x: { name: string }, y: { name: string }) => x.name.localeCompare(y.name);
    const lunaa = options.filter((a) => isLunaa(a));
    const rest = options.filter((a) => !isLunaa(a));
    return [
      { label: 'Lunaa', items: lunaa },
      { label: 'Other ad accounts', items: rest.filter((a) => a.active).sort(byName) },
      { label: 'Not active', items: rest.filter((a) => !a.active).sort(byName) },
    ].filter((g) => g.items.length > 0);
  }, [options, tracked, settings?.ad_account_id]);

  const activeId =
    account && options.some((o) => o.id === account) ? account : (settings?.ad_account_id ?? '');
  const active = tracked.find((a) => a.id === activeId);
  const pulling = Boolean(active && !active.synced_at);

  useEffect(() => {
    setPolling(pulling);
  }, [pulling]);

  const chooseAccount = async (id: string) => {
    setAccount(id);
    try {
      localStorage.setItem('ads-account', id);
    } catch {}
    if (tracked.some((a) => a.id === id)) return;
    setSwitching(true);
    try {
      mutate(await addAdAccount(id), { revalidate: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Couldn’t switch to that ad account');
      setAccount(settings?.ad_account_id ?? '');
    } finally {
      setSwitching(false);
    }
  };

  const { from, to } = rangeFor(kind, month, today);
  const { report, error, isLoading } = useMetaAdsReport(
    from,
    to,
    activeId,
    connected && Boolean(active) && !pulling,
    active?.synced_at
  );
  const currency = report?.currency ?? active?.currency ?? settings?.currency ?? null;

  const byMonth = kind === '12m';
  const buckets = useMemo(() => bucketDays(report?.days ?? [], byMonth), [report, byMonth]);
  const label = rangeLabel(kind, from, to);
  const loading = isLoading || !report || pulling;

  const t = report?.totals;
  const lastSpend = report?.last_spend_day ?? null;
  const noSpend = Boolean(t && t.spend === 0);

  const description = (() => {
    if (!connected) return 'Ad spend, chats and ROAS from your Meta ad account, beside your sales.';
    if (!t) return `Meta ads for ${label}.`;
    if (noSpend) return `No ad spend in ${kind === 'month' ? label : 'this period'}.`;
    const ran = report?.campaigns.filter((c) => c.spend > 0).length ?? 0;
    const spent = `${adMoney(t.spend, currency)} spent in ${kind === 'month' ? label : 'this period'} across ${ran} campaign${ran === 1 ? '' : 's'}`;
    if (!comparable(currency)) return `${spent}.`;
    return `${spent}, with ${formatCurrency(t.chat_revenue)} in WhatsApp sales (${times(ratio(t.chat_revenue, t.spend))}).`;
  })();

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="pb-2">
          <PageHeader title="Ads" description={description}>
            {connected && (
              <>
                <Select value={activeId} onValueChange={chooseAccount} disabled={switching}>
                  <SelectTrigger className="w-60" aria-label="Ad account">
                    {switching ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Switching…
                      </span>
                    ) : (
                      <SelectValue placeholder="Ad account" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g, i) => (
                      <SelectGroup key={g.label}>
                        {i > 0 && <SelectSeparator />}
                        <SelectLabel>{g.label}</SelectLabel>
                        {g.items.map((a) => (
                          <SelectItem key={a.id} value={a.id} disabled={!a.active}>
                            <span>{a.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {[a.business, a.currency !== 'MYR' ? a.currency : null].filter(Boolean).join(' · ')}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <Button variant="outline" asChild className="gap-1.5">
              <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer">
                Ads Manager
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </PageHeader>
          {connected && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Segmented label="Period" value={kind} onChange={setKind} options={RANGE_OPTIONS} />
              {kind === 'month' && <MonthPicker value={month} max={today.slice(0, 7)} onChange={setMonth} />}
            </div>
          )}
        </div>

        {settingsLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : !connected ? (
          <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-medium">Connect your Meta ad account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with Facebook to bring in spend, chats and ROAS for every campaign.
              </p>
            </div>
            <Button asChild>
              <Link href="/integrations/meta-ads">Connect Meta ads</Link>
            </Button>
          </Panel>
        ) : error ? (
          <Panel className="px-5 py-4 text-sm text-destructive">{error.message}</Panel>
        ) : (
          <>
            {settings?.last_sync_error && (
              <Panel className="flex flex-wrap items-center justify-between gap-2 border-destructive/40 px-5 py-3 text-sm">
                <span className="text-destructive">Last sync with Meta failed: {settings.last_sync_error}</span>
                <Link href="/integrations/meta-ads" className="font-medium hover:underline">
                  Fix in Integrations
                </Link>
              </Panel>
            )}

            {noSpend && lastSpend && lastSpend < from && (
              <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <p className="text-sm text-muted-foreground">
                  No campaigns spent in this period. Ads last ran on{' '}
                  <span className="font-medium text-foreground">{format(parseISO(lastSpend), 'd MMMM yyyy')}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setKind('month');
                    setMonth(lastSpend.slice(0, 7));
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Show {format(parseISO(lastSpend), 'MMMM yyyy')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Panel>
            )}

            {pulling && (
              <Panel className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pulling the last 13 months for {active?.name ?? 'this account'} from Meta. This takes a minute.
              </Panel>
            )}

            <AdsSummary report={pulling ? undefined : report} isLoading={loading} />
            {!noSpend && <SpendChart buckets={buckets} byMonth={byMonth} currency={currency} isLoading={loading} />}
            <CampaignTable
              campaigns={report?.campaigns ?? []}
              currency={currency}
              isLoading={loading}
              sendingOn={Boolean(settings?.send_conversions)}
            />
            <PeriodTable buckets={buckets} byMonth={byMonth} today={today} currency={currency} isLoading={loading} />

            <p className="px-1 text-xs text-muted-foreground">
              {active?.name ?? 'Ad account'}
              {activeId !== settings?.ad_account_id && ` (the dashboard uses ${settings?.account_name ?? 'the main account'})`}{' '}
              · numbers from Meta, refreshed every hour
              {report?.data_since && `, available from ${format(parseISO(report.data_since), 'd MMM yyyy')}`}. Blended ROAS is
              every WhatsApp sale (not distributor, Shopee or Lazada) ÷ ad spend over the same days, so it includes
              customers who didn’t come from an ad. Campaign ROAS counts only purchases Meta matched to that campaign.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
