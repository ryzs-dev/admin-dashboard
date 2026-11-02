'use client';

import Link from 'next/link';
import { ChevronRight, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { MetaAdsSettings, MetaCampaign } from '@/types/meta-ads';
import { Panel, PanelHeader } from './Panel';

const TH = 'px-3 py-2 text-xs font-medium text-muted-foreground';

const adMoney = (n: number, currency: string | null) =>
  !currency || currency === 'MYR' ? formatCurrency(n) : `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export function AdsPanel({
  settings,
  campaigns,
  isLoading,
  revenue,
  newCustomers,
}: {
  settings: MetaAdsSettings | undefined;
  campaigns: MetaCampaign[];
  isLoading?: boolean;
  revenue: number;
  newCustomers: number | null;
}) {
  if (!settings) return null;

  if (!settings.connected) {
    return (
      <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Connect your Meta ad account to see ad spend and ROAS beside your sales.
          </p>
        </div>
        <Link
          href="/settings?section=ads"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
        >
          Connect
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Panel>
    );
  }

  const currency = settings.currency;
  const spend = campaigns.reduce((n, c) => n + c.spend, 0);
  const conversations = campaigns.reduce((n, c) => n + c.conversations, 0);
  const active = campaigns.filter((c) => c.spend > 0);

  return (
    <Panel>
      <PanelHeader
        title="Meta ads"
        meta={settings.last_sync_error ? 'last sync failed, see Settings' : settings.account_name ?? undefined}
      >
        <Link
          href="/settings?section=ads"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Settings
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </PanelHeader>

      {isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 px-5 pb-2 pt-4 sm:grid-cols-4">
            <Figure label="Ad spend" value={adMoney(spend, currency)} />
            <Figure
              label="ROAS"
              value={spend ? `${(revenue / spend).toFixed(2)}×` : '—'}
              note="All sales ÷ ad spend"
            />
            <Figure
              label="Spend per new customer"
              value={spend && newCustomers ? adMoney(spend / newCustomers, currency) : '—'}
            />
            <Figure
              label="Chats started"
              value={conversations.toLocaleString()}
              note={conversations ? `${adMoney(spend / conversations, currency)} each` : undefined}
            />
          </div>

          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className={cn(TH, 'text-left')}>Campaign</th>
                  <th className={cn(TH, 'text-right')}>Spend</th>
                  <th className={cn(TH, 'text-right')}>Clicks</th>
                  <th className={cn(TH, 'text-right')}>Chats started</th>
                  <th className={cn(TH, 'text-right')}>Cost per chat</th>
                  <th className={cn(TH, 'text-right')} title="Purchases Meta matched to this campaign (needs orders sent to Meta)">
                    Purchases
                  </th>
                  <th className={cn(TH, 'text-right')} title="Purchase value Meta matched ÷ spend">
                    ROAS
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      {settings.last_sync_at ? 'No ad spend in this month.' : 'Pulling numbers from Meta…'}
                    </td>
                  </tr>
                ) : (
                  active.map((c) => (
                    <tr key={c.campaign_id} className="border-b border-border/60 last:border-0">
                      <td className="max-w-[280px] truncate px-3 py-2.5 font-medium" title={c.campaign_name ?? ''}>
                        {c.campaign_name ?? c.campaign_id}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{adMoney(c.spend, currency)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.clicks.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.conversations.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {c.cost_per_conversation == null ? '—' : adMoney(c.cost_per_conversation, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.purchases ? c.purchases.toLocaleString() : '—'}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.purchases && c.roas != null ? `${c.roas.toFixed(2)}×` : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!settings.send_conversions && (
            <p className="px-5 pb-4 text-xs text-muted-foreground">
              Purchases and ROAS per campaign appear once orders are sent to Meta.{' '}
              <Link href="/settings?section=ads" className="font-medium text-foreground hover:underline">
                Turn it on
              </Link>
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
