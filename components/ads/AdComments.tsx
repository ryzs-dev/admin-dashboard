'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ExternalLink, MessageCircle, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { getAdComments } from '@/lib/api/meta-ads';
import { AdComment } from '@/types/meta-ads';

const SHOW = 20;
const link = (c: AdComment) => c.permalink ?? c.post_permalink ?? undefined;

// What people commented on the account's ads in the period, newest first.
export function AdComments({ account, from, to }: { account: string; from: string; to: string }) {
  const [all, setAll] = useState(false);
  const { data, error, isLoading } = useSWR(
    ['ad-comments', account, from, to],
    () => getAdComments(account, from, to),
    {
      revalidateOnFocus: false,
    }
  );
  const comments = data ?? [];
  const shown = all ? comments : comments.slice(0, SHOW);

  return (
    <Panel>
      <PanelHeader title="Comments on ads" meta={data ? `${comments.length} in this period` : undefined} />
      <div className="px-2 pb-2 pt-2">
        {isLoading ? (
          <div className="space-y-2 px-3 pb-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">
            {error.message}{' '}
            {/sign in/i.test(error.message) && (
              <Link href="/integrations/meta-ads" className="font-medium text-foreground hover:underline">
                Open Meta ads
              </Link>
            )}
          </p>
        ) : comments.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">No comments on this account’s ads in this period.</p>
        ) : (
          <>
            <ul className="divide-y">
              {shown.map((c) => (
                <li key={c.id} className="px-3 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium text-foreground">{c.from ?? 'Someone'}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(c.created_time), 'd MMM, h:mm a')}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-foreground">{c.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="min-w-0 truncate" title={c.ads.join(', ')}>
                      on {c.ads[0]}
                      {c.ads.length > 1 && ` +${c.ads.length - 1}`}
                    </span>
                    {c.likes > 0 && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {c.likes}
                      </span>
                    )}
                    {c.replies > 0 && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {c.replies} {c.replies === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                    {link(c) && (
                      <a
                        href={link(c)}
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
            {comments.length > SHOW && (
              <button
                type="button"
                onClick={() => setAll(!all)}
                className="w-full px-3 py-2 text-left text-sm font-medium hover:underline"
              >
                {all ? 'Show fewer' : `Show all ${comments.length}`}
              </button>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
