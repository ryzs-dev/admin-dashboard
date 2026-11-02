'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronRight, ExternalLink, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/components/dashboard/Panel';
import { MonthPicker } from '@/components/dashboard/PeriodPickers';
import { Segmented } from '@/components/modules/settings/Segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { formatCurrency } from '@/lib/utils/currency';

export default function AdsPage() {
  const today = todayInMalaysia();
  const [kind, setKind] = useState<RangeKind>('month');
  const [month, setMonth] = useState(today.slice(0, 7));

  const [account, setAccount] = useState('all');

  const { settings, isLoading: settingsLoading } = useMetaAdsSettings();
  const connected = Boolean(settings?.connected);
  const accounts = settings?.accounts ?? [];
  const mainCurrency = settings?.currency ?? null;
  const sameCurrency = accounts.filter((a) => a.currency === mainCurrency);
  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name ?? a.id]));

  // Remember the account per browser; fall back to all if it was removed.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ads-account');
      if (saved) setAccount(saved);
    } catch {}
  }, []);
  const known = account === 'all' || accounts.some((a) => a.id === account);
  const activeAccount = known ? account : 'all';
  const chooseAccount = (value: string) => {
    setAccount(value);
    try {
      localStorage.setItem('ads-account', value);
    } catch {}
  };

  const { from, to } = rangeFor(kind, month, today);
  const { report, error, isLoading } = useMetaAdsReport(from, to, activeAccount, connected && (known || !settings));
  const currency = report?.currency ?? mainCurrency;

  const byMonth = kind === '12m';
  const buckets = useMemo(() => bucketDays(report?.days ?? [], byMonth), [report, byMonth]);
  const label = rangeLabel(kind, from, to);
  const loading = isLoading || !report;

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
                {accounts.length > 1 && (
                  <Select value={activeAccount} onValueChange={chooseAccount}>
                    <SelectTrigger className="w-56" aria-label="Ad account">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* With one ringgit account, "all" is just that account. */}
                      <SelectItem value="all">
                        {sameCurrency.length === 1
                          ? (sameCurrency[0].name ?? sameCurrency[0].id)
                          : sameCurrency.length === accounts.length
                            ? 'All ad accounts'
                            : `All ${mainCurrency} accounts`}
                      </SelectItem>
                      {(sameCurrency.length === 1 ? accounts.filter((a) => a.currency !== mainCurrency) : accounts).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name ?? a.id}
                          {a.currency !== mainCurrency && (
                            <span className="ml-2 text-xs text-muted-foreground">{a.currency}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Segmented label="Period" value={kind} onChange={setKind} options={RANGE_OPTIONS} />
                {kind === 'month' && <MonthPicker value={month} max={today.slice(0, 7)} onChange={setMonth} />}
              </>
            )}
            <Button variant="outline" asChild className="gap-1.5">
              <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer">
                Ads Manager
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </PageHeader>
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

            <AdsSummary report={report} isLoading={loading} />
            {!noSpend && <SpendChart buckets={buckets} byMonth={byMonth} currency={currency} isLoading={loading} />}
            <CampaignTable
              campaigns={report?.campaigns ?? []}
              currency={currency}
              showAccount={(report?.accounts.length ?? 0) > 1}
              accountNames={accountNames}
              isLoading={loading}
              sendingOn={Boolean(settings?.send_conversions)}
            />
            <PeriodTable buckets={buckets} byMonth={byMonth} today={today} currency={currency} isLoading={loading} />

            <p className="px-1 text-xs text-muted-foreground">
              {report?.accounts.map((a) => a.name ?? a.id).join(', ') ?? settings?.account_name ?? 'Ad account'}
              {accounts.length === 1 && (
                <>
                  {' '}
                  (<Link href="/integrations/meta-ads" className="underline-offset-2 hover:underline">add another ad account</Link>)
                </>
              )}{' '}
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
