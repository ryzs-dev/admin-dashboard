'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ExternalLink, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { getAdComments } from '@/lib/api/meta-ads';

const SHOW_ADS = 10;
const SHOW_COMMENTS = 5;

// Comments on the account's ads in the period, under the ad they were left on.
export function AdComments({ account, from, to }: { account: string; from: string; to: string }) {
  const [allAds, setAllAds] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data, error, isLoading } = useSWR(
    ['ad-comments', account, from, to],
    () => getAdComments(account, from, to),
    {
      revalidateOnFocus: false,
    }
  );
  const groups = data ?? [];
  const count = groups.reduce((n, g) => n + g.comments.length, 0);
  const shown = allAds ? groups : groups.slice(0, SHOW_ADS);

  return (
    <Panel>
      <PanelHeader
        title="Comments on ads"
        meta={data ? `${count} in this period, on ${groups.length} ${groups.length === 1 ? 'ad' : 'ads'}` : undefined}
      />
      <div className="space-y-3 px-5 pb-5 pt-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments on this account’s ads in this period.</p>
        ) : (
          <>
            {shown.map((g) => {
              const open = expanded.has(g.post_id);
              const comments = open ? g.comments : g.comments.slice(0, SHOW_COMMENTS);
              return (
                <div key={g.post_id} className="rounded-md border">
                  <div className="flex items-center gap-3 border-b bg-muted/30 px-3 py-2.5">
                    {g.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={g.ads.join(', ')}>
                        {g.ads[0]}
                        {g.ads.length > 1 && (
                          <span className="font-normal text-muted-foreground"> +{g.ads.length - 1} more ads</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={g.campaigns.join(', ')}>
                        {g.campaigns.join(', ')} · {g.total.toLocaleString()} comments in total
                      </p>
                    </div>
                    {g.permalink && (
                      <a
                        href={g.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
                      >
                        View ad
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <ul className="divide-y">
                    {comments.map((c) => (
                      <li key={c.id} className="px-3 py-2.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className="font-medium text-foreground">{c.from ?? 'Someone'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(c.created_time), 'd MMM, h:mm a')}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-foreground">{c.message}</p>
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
                  {g.comments.length > SHOW_COMMENTS && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(expanded);
                        if (open) next.delete(g.post_id);
                        else next.add(g.post_id);
                        setExpanded(next);
                      }}
                      className="w-full border-t px-3 py-2 text-left text-xs font-medium hover:underline"
                    >
                      {open ? 'Show fewer' : `Show all ${g.comments.length} from this period`}
                    </button>
                  )}
                </div>
              );
            })}
            {groups.length > SHOW_ADS && (
              <button type="button" onClick={() => setAllAds(!allAds)} className="text-sm font-medium hover:underline">
                {allAds ? 'Show fewer ads' : `Show all ${groups.length} ads`}
              </button>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
