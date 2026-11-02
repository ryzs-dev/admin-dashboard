import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { MetaAdsReport } from '@/types/meta-ads';
import { Panel } from '@/components/dashboard/Panel';
import { ratio, times } from './period';

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

export function AdsSummary({ report, isLoading }: { report?: MetaAdsReport; isLoading?: boolean }) {
  const t = report?.totals;
  const ran = report?.campaigns.filter((c) => c.spend > 0).length ?? 0;
  const roas = t ? ratio(t.chat_revenue, t.spend) : null;
  const allRoas = t ? ratio(t.revenue, t.spend) : null;
  const perChat = t?.spend ? ratio(t.spend, t.conversations) : null;
  const perNew = t?.spend ? ratio(t.spend, t.new_customers) : null;

  return (
    <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4 [&>*]:bg-card">
      <Cell label="Ad spend" value={formatCurrency(t?.spend ?? 0)} lead isLoading={isLoading}>
        {ran === 1 ? '1 campaign ran' : `${ran} campaigns ran`}
        {t && t.clicks > 0 && ` · ${t.clicks.toLocaleString()} clicks`}
      </Cell>
      <Cell label="Blended ROAS" value={times(roas)} isLoading={isLoading}>
        <span title="All WhatsApp sales in the period (not distributor, Shopee or Lazada) ÷ ad spend. Includes customers who didn't come from an ad.">
          WhatsApp sales {formatCurrency(t?.chat_revenue ?? 0)}
        </span>
        {allRoas != null && <> · all channels {times(allRoas)}</>}
      </Cell>
      <Cell label="Chats started" value={(t?.conversations ?? 0).toLocaleString()} isLoading={isLoading}>
        {perChat != null ? `${formatCurrency(perChat)} per chat` : 'From ads that open WhatsApp'}
      </Cell>
      <Cell label="New customers" value={(t?.new_customers ?? 0).toLocaleString()} isLoading={isLoading}>
        {perNew != null ? `${formatCurrency(perNew)} ad spend each` : 'First order in this period'}
      </Cell>
    </Panel>
  );
}
