'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ExternalLink, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getPostComments } from '@/lib/api/meta-ads';

// The latest comments on one post, loaded when it's opened.
export function PostComments({
  pageId,
  postId,
  permalink,
}: {
  pageId: string;
  postId: string;
  permalink: string | null;
}) {
  const { data, error, isLoading } = useSWR(['post-comments', postId], () => getPostComments(pageId, postId), {
    revalidateOnFocus: false,
  });
  if (isLoading) {
    return (
      <div className="mt-3 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        {error.message}{' '}
        {/sign in/i.test(error.message) && (
          <Link href="/integrations/meta-ads" className="font-medium text-foreground hover:underline">
            Open Meta ads
          </Link>
        )}
      </p>
    );
  }
  if (!data?.length) return <p className="mt-3 text-sm text-muted-foreground">No comments to show.</p>;
  return (
    <div className="mt-3 rounded-md bg-muted/40">
      <ul className="divide-y">
        {data.map((c) => (
          <li key={c.id} className="px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium text-foreground">{c.from ?? 'Someone'}</span>
              <span className="text-xs text-muted-foreground">{format(parseISO(c.created_time), 'd MMM, h:mm a')}</span>
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
      {permalink && (
        <a
          href={permalink}
          target="_blank"
          rel="noreferrer"
          className="block px-3 py-2 text-xs font-medium text-foreground hover:underline"
        >
          Latest {data.length} shown · see all on Facebook
        </a>
      )}
    </div>
  );
}
