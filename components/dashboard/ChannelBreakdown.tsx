import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { ChannelTotalsDTO, SalesChannel } from '@/types/stats';

const CHANNELS: {
  key: SalesChannel;
  label: string;
  color: string;
  logo?: string;
}[] = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  {
    key: 'shopee',
    label: 'Shopee',
    color: '#EE4D2D',
    logo: '/images/integrations/shopee.png',
  },
  {
    key: 'lazada',
    label: 'Lazada',
    color: '#1A2BAE',
    logo: '/images/integrations/lazada.png',
  },
];

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

  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">Sales by channel</p>
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(totalRevenue)} total
            </p>
          )}
        </div>

        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
          {CHANNELS.map(({ key, color }) => {
            const revenue = Number(channels[key]?.revenue ?? 0);
            if (!totalRevenue || !revenue) return null;
            return (
              <div
                key={key}
                className="h-full transition-all"
                style={{
                  width: `${(revenue / totalRevenue) * 100}%`,
                  backgroundColor: color,
                }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {CHANNELS.map(({ key, label, color, logo }) => {
            const { orders = 0, revenue = 0 } = channels[key] ?? {};
            const share = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

            return (
              <div
                key={key}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0"
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={32}
                    height={32}
                    className="shrink-0 rounded-md"
                  />
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${color}1f` }}
                  >
                    <MessageCircle className="h-4 w-4" style={{ color }} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{label}</span>
                    <span className="tabular-nums">
                      {share.toFixed(share > 0 && share < 1 ? 1 : 0)}%
                    </span>
                  </p>
                  {isLoading ? (
                    <Skeleton className="my-1 h-5 w-24" />
                  ) : (
                    <p className="truncate text-lg font-semibold tabular-nums">
                      {formatCurrency(revenue)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {orders.toLocaleString()} {orders === 1 ? 'order' : 'orders'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
