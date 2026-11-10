'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronDown, ExternalLink, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCampaignAds } from '@/lib/api/meta-ads';
import { PostComments } from './PostComments';
import { adMoney } from './period';

const STATUS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  ADSET_PAUSED: 'Ad set paused',
  CAMPAIGN_PAUSED: 'Campaign paused',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
  DISAPPROVED: 'Rejected',
  WITH_ISSUES: 'Has issues',
  IN_PROCESS: 'In review',
  PENDING_REVIEW: 'In review',
};

// A campaign's ads in the period; each ad opens its comments.
export function CampaignAds({
  account,
  campaignId,
  from,
  to,
  currency,
}: {
  account: string;
  campaignId: string;
  from: string;
  to: string;
  currency?: string | null;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const { data, error, isLoading } = useSWR(
    ['campaign-ads', account, campaignId, from, to],
    () => getCampaignAds(account, campaignId, from, to),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (error) return <p className="py-3 text-sm text-destructive">{error.message}</p>;
  if (!data?.length) return <p className="py-3 text-sm text-muted-foreground">No ads showed in this period.</p>;

  return (
    <ul className="divide-y rounded-md border bg-card">
      {data.map((ad) => (
        <li key={ad.ad_id} className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            {ad.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded object-cover" />
            ) : (
              <div className="h-11 w-11 shrink-0 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" title={ad.name}>
                {ad.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {[
                  ad.status ? (STATUS[ad.status] ?? ad.status.toLowerCase().replace(/_/g, ' ')) : null,
                  `${adMoney(ad.spend, currency)} spent`,
                  ad.conversations ? `${ad.conversations} chats` : null,
                  `${ad.clicks.toLocaleString()} clicks`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs">
              <button
                type="button"
                disabled={!ad.comments || !ad.post_id}
                onClick={() => setOpen(open === ad.ad_id ? null : ad.ad_id)}
                aria-expanded={open === ad.ad_id}
                className="flex items-center gap-1 tabular-nums text-muted-foreground enabled:font-medium enabled:text-foreground enabled:hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {ad.comments.toLocaleString()} {ad.comments === 1 ? 'comment' : 'comments'}
                {ad.comments > 0 && (
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open === ad.ad_id && 'rotate-180')} />
                )}
              </button>
              {ad.permalink && (
                <a
                  href={ad.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium hover:underline"
                >
                  View ad
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          {open === ad.ad_id && ad.post_id && ad.page_id && (
            <div className="pl-14">
              <PostComments pageId={ad.page_id} postId={ad.post_id} permalink={ad.permalink} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
