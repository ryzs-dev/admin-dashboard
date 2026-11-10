'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ExternalLink, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { adMoney, spanLabel, statusLabel } from '@/components/ads/period';
import { useMetaAdsSettings } from '@/hooks/useMetaAds';
import { getAdDetail } from '@/lib/api/meta-ads';

function Stat({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1.5 h-6 w-20" />
      ) : (
        <p className="mt-1 truncate text-2xl font-medium tabular-nums tracking-tight">{value}</p>
      )}
    </div>
  );
}

function AdPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const account = params.get('account') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const { settings } = useMetaAdsSettings();
  const currency = settings?.accounts.find((a) => a.id === account)?.currency ?? settings?.currency ?? null;

  const {
    data: ad,
    error,
    isLoading,
  } = useSWR(from && to ? ['ad-detail', id, from, to] : null, () => getAdDetail(id, from, to), {
    revalidateOnFocus: false,
  });
  const loading = isLoading || !ad;
  const query = new URLSearchParams({ account, from, to }).toString();
  const perChat = ad && ad.conversations ? ad.spend / ad.conversations : null;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Link
          href={ad?.campaign ? `/ads/campaign/${ad.campaign.id}?${query}` : '/ads'}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {ad?.campaign?.name ?? 'Ads'}
        </Link>

        {error ? (
          <Panel className="px-5 py-4 text-sm text-destructive">{error.message}</Panel>
        ) : (
          <>
            <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center">
              {loading ? (
                <Skeleton className="h-20 w-20 shrink-0 rounded-md" />
              ) : ad.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.thumbnail} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{ad?.name ?? 'Ad'}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[statusLabel(ad?.status), from && to ? spanLabel(from, to) : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              {ad?.permalink && (
                <Button variant="outline" asChild className="gap-1.5">
                  <a href={ad.permalink} target="_blank" rel="noreferrer">
                    View on Facebook
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>

            <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4 [&>*]:bg-card">
              <Stat label="Spend" value={adMoney(ad?.spend ?? 0, currency)} isLoading={loading} />
              <Stat
                label="Chats started"
                value={`${(ad?.conversations ?? 0).toLocaleString()}${perChat != null ? ` · ${adMoney(perChat, currency)} each` : ''}`}
                isLoading={loading}
              />
              <Stat label="Clicks" value={(ad?.clicks ?? 0).toLocaleString()} isLoading={loading} />
              <Stat label="Impressions" value={(ad?.impressions ?? 0).toLocaleString()} isLoading={loading} />
            </Panel>

            <Panel>
              <PanelHeader
                title="Comments"
                meta={
                  ad
                    ? ad.total_comments > ad.comments.length
                      ? `latest ${ad.comments.length} of ${ad.total_comments.toLocaleString()}`
                      : `${ad.total_comments.toLocaleString()} in total`
                    : undefined
                }
              />
              <div className="px-2 pb-2 pt-2">
                {loading ? (
                  <div className="space-y-2 px-3 pb-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : ad.comments.length === 0 ? (
                  <p className="px-3 pb-3 text-sm text-muted-foreground">
                    {ad.post_id
                      ? 'No comments on this ad yet.'
                      : 'This ad has no Facebook post, so it has no comments.'}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {ad.comments.map((c) => (
                      <li key={c.id} className="px-3 py-3">
                        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className="font-medium">{c.from ?? 'Someone'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(c.created_time), 'd MMM yyyy, h:mm a')}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-line text-sm">{c.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
                          {c.likes > 0 && (
                            <span className="flex items-center gap-1 tabular-nums">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {c.likes}
                            </span>
                          )}
                          {c.replies > 0 && <span>{c.replies === 1 ? '1 reply' : `${c.replies} replies`}</span>}
                          {c.permalink && (
                            <a
                              href={c.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                            >
                              Reply on Facebook
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdPage />
    </Suspense>
  );
}
