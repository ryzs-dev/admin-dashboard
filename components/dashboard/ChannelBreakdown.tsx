import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS } from '@/lib/chartTheme';
import { formatCurrency } from '@/lib/utils/currency';
import { ChannelTotalsDTO, SalesChannel } from '@/types/stats';
import { Panel, PanelHeader } from './Panel';

const CHANNELS: { key: SalesChannel; label: string; logo?: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'shopee', label: 'Shopee', logo: '/images/integrations/shopee.png' },
  { key: 'lazada', label: 'Lazada', logo: '/images/integrations/lazada.png' },
];

const formatShare = (share: number) =>
  `${share.toFixed(share > 0 && share < 1 ? 1 : 0)}%`;

export function ChannelBreakdown({
  channels,
  isLoading,
}: {
  channels: ChannelTotalsDTO;
  isLoading?: boolean;
}) {
  const totalRevenue = CHANNELS.reduce(
    (sum, { key }) => sum + Number(channels[key]?.revenue ?? 0),
    0
  );
  const topRevenue = Math.max(
    ...CHANNELS.map(({ key }) => Number(channels[key]?.revenue ?? 0))
  );

  return (
    <Panel>
      <PanelHeader title="By channel" />
      <ul className="space-y-3 px-5 pb-4 pt-3">
        {CHANNELS.map(({ key, label, logo }) => {
          const { orders = 0, revenue = 0 } = channels[key] ?? {};
          const share = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

          return (
            <li key={key}>
              <div className="flex items-center gap-2.5 text-sm">
                {logo ? (
                  <Image src={logo} alt="" width={18} height={18} className="shrink-0 rounded" />
                ) : (
                  <MessageCircle className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                )}
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {orders.toLocaleString()} {orders === 1 ? 'order' : 'orders'}
                </span>
                {isLoading ? (
                  <Skeleton className="ml-auto h-4 w-20" />
                ) : (
                  <span className="ml-auto tabular-nums font-medium text-foreground">
                    {formatCurrency(revenue)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: topRevenue > 0 ? `${(revenue / topRevenue) * 100}%` : 0,
                      background: CHART_COLORS.primary,
                    }}
                  />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {formatShare(share)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
