'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MetaCampaign } from '@/types/meta-ads';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { adMoney } from './period';

type SortKey =
  | 'spend'
  | 'impressions'
  | 'clicks'
  | 'ctr'
  | 'conversations'
  | 'cost_per_conversation'
  | 'purchases'
  | 'roas';

const COLUMNS: {
  key: SortKey;
  label: string;
  title?: string;
  lowFirst?: boolean;
}[] = [
  { key: 'spend', label: 'Spend' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'ctr', label: 'CTR', title: 'Clicks ÷ impressions' },
  { key: 'conversations', label: 'Chats started' },
  { key: 'cost_per_conversation', label: 'Cost per chat', lowFirst: true },
  {
    key: 'purchases',
    label: 'Purchases',
    title: 'Purchases Meta matched to the campaign (needs orders sent to Meta)',
  },
  { key: 'roas', label: 'ROAS', title: 'Purchase value Meta matched ÷ spend' },
];

const TH = 'px-3 py-2 text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 text-right tabular-nums whitespace-nowrap';
const dash = <span className="text-muted-foreground/60">—</span>;

function ran(c: MetaCampaign) {
  if (!c.first_day || !c.last_day) return null;
  const a = parseISO(c.first_day);
  const b = parseISO(c.last_day);
  if (c.first_day === c.last_day) return format(a, 'd MMM');
  const sameMonth = c.first_day.slice(0, 7) === c.last_day.slice(0, 7);
  return `${format(a, sameMonth ? 'd' : 'd MMM')} – ${format(b, 'd MMM')}`;
}

export function CampaignTable({
  campaigns,
  currency,
  showAccount,
  accountNames,
  isLoading,
  sendingOn,
}: {
  campaigns: MetaCampaign[];
  currency?: string | null;
  // With more than one account in view, say which each campaign is from.
  showAccount?: boolean;
  accountNames?: Record<string, string>;
  isLoading?: boolean;
  sendingOn: boolean;
}) {
  const [sort, setSort] = useState<SortKey>('spend');
  const total = campaigns.reduce((n, c) => n + c.spend, 0);
  const column = COLUMNS.find((c) => c.key === sort)!;

  const rows = useMemo(() => {
    const value = (c: MetaCampaign) => c[sort] ?? null;
    return [...campaigns].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      if (x == null && y == null) return b.spend - a.spend;
      if (x == null) return 1;
      if (y == null) return -1;
      return column.lowFirst ? x - y : y - x;
    });
  }, [campaigns, sort, column.lowFirst]);

  return (
    <Panel>
      <PanelHeader
        title="Campaigns"
        meta={
          campaigns.length ? `${campaigns.length} with delivery` : undefined
        }
      />
      {!isLoading && rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No campaign ran in this period.
        </p>
      ) : (
        <div className="overflow-x-auto px-2 pb-2 pt-1">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b">
                <th className={cn(TH, 'text-left')}>Campaign</th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(TH, 'text-right')}
                    title={col.title}
                    aria-sort={sort === col.key ? 'descending' : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => setSort(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-foreground',
                        sort === col.key && 'text-foreground'
                      )}
                    >
                      {sort === col.key && <ArrowDown className="h-3 w-3" />}
                      {col.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={COLUMNS.length + 1} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((c) => {
                    const share = total ? (c.spend / total) * 100 : 0;
                    return (
                      <tr
                        key={c.campaign_id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="max-w-[300px] px-3 py-2.5">
                          <p
                            className="truncate font-medium"
                            title={c.campaign_name ?? ''}
                          >
                            {c.campaign_name ?? c.campaign_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              showAccount && c.ad_account_id
                                ? accountNames?.[c.ad_account_id]
                                : null,
                              ran(c) ? `Ran ${ran(c)}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </td>
                        <td className={TD}>
                          <span className="font-medium">
                            {adMoney(c.spend, currency)}
                          </span>
                          <div className="ml-auto mt-1 h-1 w-20 rounded-full bg-muted">
                            <div
                              className="h-1 rounded-full bg-primary/70"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                        </td>
                        <td className={TD}>{c.impressions.toLocaleString()}</td>
                        <td className={TD}>{c.clicks.toLocaleString()}</td>
                        <td className={TD}>
                          {c.ctr == null ? dash : `${c.ctr.toFixed(2)}%`}
                        </td>
                        <td className={TD}>
                          {c.conversations
                            ? c.conversations.toLocaleString()
                            : dash}
                        </td>
                        <td className={TD}>
                          {c.cost_per_conversation == null
                            ? dash
                            : adMoney(c.cost_per_conversation, currency)}
                        </td>
                        <td className={TD}>
                          {c.purchases ? c.purchases.toLocaleString() : dash}
                        </td>
                        <td className={TD}>
                          {c.purchases && c.purchase_value > 0 && c.roas != null
                            ? `${c.roas.toFixed(2)}×`
                            : dash}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
      {!sendingOn && rows.length > 0 && !rows.some((c) => c.purchases > 0) && (
        <p className="px-5 pb-4 text-xs text-muted-foreground">
          No purchases matched to campaigns yet. Turn on sending WhatsApp orders
          to Meta (Integrations → Meta ads) so each campaign shows its purchases
          and ROAS.
        </p>
      )}
    </Panel>
  );
}
