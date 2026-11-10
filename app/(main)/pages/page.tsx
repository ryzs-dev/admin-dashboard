'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ExternalLink, ThumbsUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/components/dashboard/Panel';
import { MonthPicker } from '@/components/dashboard/PeriodPickers';
import { Segmented } from '@/components/modules/settings/Segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageInsights } from '@/components/ads/PageInsights';
import { RANGE_OPTIONS, RangeKind, rangeFor, rangeLabel, todayInMalaysia } from '@/components/ads/period';
import { useMetaAdsSettings } from '@/hooks/useMetaAds';
import { getFacebookPageReport, getFacebookPages } from '@/lib/api/meta-ads';

export default function PagesPage() {
  const today = todayInMalaysia();
  const [kind, setKind] = useState<RangeKind>('month');
  const [month, setMonth] = useState(today.slice(0, 7));
  const [pageId, setPageId] = useState('');

  const { settings, isLoading: settingsLoading } = useMetaAdsSettings();
  const connected = Boolean(settings?.connected);
  const pages = useSWR(connected ? 'facebook-pages' : null, getFacebookPages, { revalidateOnFocus: false });
  const page = pages.data?.find((p) => p.id === pageId && p.access) ?? pages.data?.find((p) => p.access);

  const { from, to } = rangeFor(kind, month, today);
  const report = useSWR(
    page ? ['facebook-page-report', page.id, from, to] : null,
    () => getFacebookPageReport(page!.id, from, to),
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  const label = rangeLabel(kind, from, to);
  const failure = pages.error ?? report.error;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="pb-2">
          <PageHeader
            title="Pages"
            description={
              connected
                ? `Followers, views and posts for ${page?.name ?? 'your Facebook page'}, ${label}.`
                : 'Followers, views and posts for your Facebook page.'
            }
          >
            {(pages.data?.length ?? 0) > 0 && (
              <Select value={page?.id ?? ''} onValueChange={setPageId}>
                <SelectTrigger className="w-64" aria-label="Facebook page">
                  <SelectValue placeholder="Facebook page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.data!.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={!p.access}>
                      <span className="flex items-center gap-2">
                        {p.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.picture} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : null}
                        <span>{p.name}</span>
                        {!p.access && <span className="text-xs text-muted-foreground">no access</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {page?.link && (
              <Button variant="outline" asChild className="gap-1.5">
                <a href={page.link} target="_blank" rel="noreferrer">
                  Open page
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
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
            <ThumbsUp className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-medium">Sign in with Facebook</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The same sign-in as Meta ads brings in your page’s followers, views and posts.
              </p>
            </div>
            <Button asChild>
              <Link href="/integrations/meta-ads">Connect Meta</Link>
            </Button>
          </Panel>
        ) : failure ? (
          <Panel className="px-5 py-4 text-sm text-destructive">{failure.message}</Panel>
        ) : pages.data && !page ? (
          <Panel className="px-5 py-4 text-sm text-muted-foreground">
            {settings?.connected_by ?? 'The person who signed in'} doesn’t manage any Facebook page. Sign in with
            Facebook again as someone who manages the LUNAA page.
          </Panel>
        ) : (
          <PageInsights report={report.data} byMonth={kind === '12m'} isLoading={!report.data || report.isLoading} />
        )}
      </div>
    </div>
  );
}
