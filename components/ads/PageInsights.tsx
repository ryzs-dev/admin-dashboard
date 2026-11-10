'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ExternalLink, Heart, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chartTheme';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { FacebookPageDay, FacebookPageReport } from '@/types/meta-ads';
import { getPostComments } from '@/lib/api/meta-ads';

const num = (n: number) => n.toLocaleString();
const short = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
      : `${n}`;

function Cell({
  label,
  value,
  lead,
  isLoading,
  children,
}: {
  label: string;
  value: string;
  lead?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className={cn('mt-1.5', lead ? 'h-8 w-40' : 'h-6 w-24')} />
      ) : (
        <p
          className={cn(
            'mt-1 truncate tabular-nums tracking-tight text-foreground',
            lead ? 'text-[30px] font-bold leading-9' : 'text-2xl font-medium leading-8'
          )}
        >
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

type Bucket = Omit<FacebookPageDay, 'date'> & {
  key: string;
  label: string;
  short: string;
};

function bucket(days: FacebookPageDay[], byMonth: boolean): Bucket[] {
  if (!byMonth) {
    return days.map((d) => ({
      ...d,
      key: d.date,
      label: format(parseISO(d.date), 'EEE d MMM'),
      short: format(parseISO(d.date), 'd MMM'),
    }));
  }
  const map = new Map<string, Bucket>();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    const b =
      map.get(key) ??
      ({
        key,
        label: format(parseISO(`${key}-01`), 'MMMM yyyy'),
        short: format(parseISO(`${key}-01`), 'MMM yy'),
        views: 0,
        viewers: 0,
        engagements: 0,
        visits: 0,
        follows: 0,
        unfollows: 0,
        video_views: 0,
      } as Bucket);
    b.views += d.views;
    b.engagements += d.engagements;
    b.visits += d.visits;
    b.follows += d.follows;
    b.unfollows += d.unfollows;
    b.video_views += d.video_views;
    map.set(key, b);
  }
  return [...map.values()];
}

// The latest comments on one post, loaded when it's opened.
function PostComments({ pageId, postId, permalink }: { pageId: string; postId: string; permalink: string | null }) {
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

function Key({ color, label, bar }: { color: string; label: string; bar?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={bar ? 'h-2.5 w-2.5 rounded-[2px]' : 'h-0.5 w-3 rounded-full'} style={{ background: color }} />
      {label}
    </span>
  );
}

export function PageInsights({
  report,
  byMonth,
  isLoading,
}: {
  report?: FacebookPageReport;
  byMonth: boolean;
  isLoading?: boolean;
}) {
  const t = report?.totals;
  const buckets = useMemo(() => bucket(report?.days ?? [], byMonth), [report, byMonth]);
  const every = byMonth ? 0 : Math.max(0, Math.ceil(buckets.length / 8) - 1);
  const net = t ? t.follows - t.unfollows : 0;
  const posts = report?.posts ?? [];
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4 [&>*]:bg-card">
        <Cell label="Followers" value={num(report?.page.followers ?? 0)} lead isLoading={isLoading}>
          {t &&
            `${net >= 0 ? '+' : ''}${num(net)} in this period (${num(t.follows)} followed, ${num(t.unfollows)} left)`}
        </Cell>
        <Cell label="Views" value={num(t?.views ?? 0)} isLoading={isLoading}>
          {t && `${num(t.video_views)} video views`}
        </Cell>
        <Cell label="Engagements" value={num(t?.engagements ?? 0)} isLoading={isLoading}>
          Reactions, comments, shares and clicks
        </Cell>
        <Cell label="Page visits" value={num(t?.visits ?? 0)} isLoading={isLoading}>
          People who opened the page
        </Cell>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader title="Views and engagement" meta={byMonth ? 'by month' : 'by day'}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Key color={CHART_COLORS.primarySoft} label="Views" bar />
            <Key color={CHART_COLORS.primary} label="Engagements" />
          </div>
        </PanelHeader>
        <div className="h-[280px] px-2 pb-3 pt-2">
          {isLoading ? (
            <Skeleton className="mx-3 h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={buckets} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="short" {...chartAxis} interval={every} minTickGap={8} />
                <YAxis yAxisId="views" {...chartAxis} width={56} tickCount={5} tickFormatter={short} />
                <YAxis
                  yAxisId="eng"
                  orientation="right"
                  {...chartAxis}
                  width={56}
                  tickCount={5}
                  tickFormatter={short}
                />
                <Tooltip
                  {...chartTooltip}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                  formatter={(v, name) => [num(Number(v)), name === 'views' ? 'Views' : 'Engagements']}
                />
                <Bar
                  yAxisId="views"
                  dataKey="views"
                  fill={CHART_COLORS.primarySoft}
                  maxBarSize={byMonth ? 36 : 16}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="eng"
                  type="linear"
                  dataKey="engagements"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Posts" meta={isLoading ? undefined : `${posts.length} in this period`} />
        <div className="px-2 pb-2 pt-2">
          {isLoading ? (
            <div className="space-y-2 px-3 pb-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : posts.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-muted-foreground">No posts on the page in this period.</p>
          ) : (
            <ul className="divide-y">
              {posts.map((p) => (
                <li key={p.id} className="flex items-start gap-3 px-3 py-3">
                  {p.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.picture} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-foreground">{p.message || 'No caption'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{format(parseISO(p.created_time), 'd MMM yyyy, h:mm a')}</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Heart className="h-3.5 w-3.5" />
                        {num(p.reactions)}
                      </span>
                      <button
                        type="button"
                        disabled={p.comments === 0}
                        onClick={() => setOpen(open === p.id ? null : p.id)}
                        aria-expanded={open === p.id}
                        className="flex items-center gap-1 tabular-nums enabled:font-medium enabled:text-foreground enabled:hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {num(p.comments)} {p.comments === 1 ? 'comment' : 'comments'}
                        {p.comments > 0 && (
                          <ChevronDown
                            className={cn('h-3.5 w-3.5 transition-transform', open === p.id && 'rotate-180')}
                          />
                        )}
                      </button>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Share2 className="h-3.5 w-3.5" />
                        {num(p.shares)}
                      </span>
                      {p.permalink && (
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {open === p.id && report && (
                      <PostComments pageId={report.page.id} postId={p.id} permalink={p.permalink} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <p className="px-1 text-xs text-muted-foreground">
        {report?.page.name ?? 'Facebook page'} · numbers from Meta, refreshed every 10 minutes. Meta counts days in US
        Pacific time, so each day starts around 3–4pm Malaysia time. Posts lists what the page published; ads without a
        page post aren’t included.
      </p>
    </>
  );
}
