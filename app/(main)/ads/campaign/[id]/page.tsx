'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { adMoney, spanLabel, statusLabel } from '@/components/ads/period';
import { useMetaAdsSettings } from '@/hooks/useMetaAds';
import { getCampaignAds } from '@/lib/api/meta-ads';

function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const account = params.get('account') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const { settings } = useMetaAdsSettings();
  const currency = settings?.accounts.find((a) => a.id === account)?.currency ?? settings?.currency ?? null;

  const { data, error, isLoading } = useSWR(
    account && from && to ? ['campaign-ads', account, id, from, to] : null,
    () => getCampaignAds(account, id, from, to),
    { revalidateOnFocus: false }
  );
  const ads = data?.ads ?? [];
  const spend = ads.reduce((n, a) => n + a.spend, 0);
  const query = new URLSearchParams({ account, from, to }).toString();

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Link
          href="/ads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Ads
        </Link>
        <div className="pb-2">
          <PageHeader
            title={data?.campaign?.name ?? (isLoading ? 'Campaign' : 'Campaign')}
            description={
              from && to
                ? [
                    statusLabel(data?.campaign?.status),
                    spanLabel(from, to),
                    data
                      ? `${ads.length} ${ads.length === 1 ? 'ad' : 'ads'} showed, ${adMoney(spend, currency)} spent`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
          />
        </div>

        {error ? (
          <Panel className="px-5 py-4 text-sm text-destructive">{error.message}</Panel>
        ) : (
          <Panel>
            <PanelHeader title="Ads" meta="most spend first" />
            <div className="px-2 pb-2 pt-2">
              {isLoading || !data ? (
                <div className="space-y-2 px-3 pb-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : ads.length === 0 ? (
                <p className="px-3 pb-3 text-sm text-muted-foreground">No ads showed in this period.</p>
              ) : (
                <ul className="divide-y">
                  {ads.map((ad) => (
                    <li key={ad.ad_id}>
                      <Link
                        href={`/ads/ad/${ad.ad_id}?${query}`}
                        className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-muted/50"
                      >
                        {ad.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ad.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" title={ad.name}>
                            {ad.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              statusLabel(ad.status),
                              `${adMoney(ad.spend, currency)} spent`,
                              ad.conversations ? `${ad.conversations} chats` : null,
                              `${ad.clicks.toLocaleString()} clicks`,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {ad.comments.toLocaleString()}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CampaignPage />
    </Suspense>
  );
}
