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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {CHANNELS.map(({ key, label, color, logo }) => {
        const { orders = 0, revenue = 0 } = channels[key] ?? {};
        const share = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

        return (
          <Card key={key} className="gap-0 py-0">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{label} sales</p>
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-md"
                  />
                ) : (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${color}1f` }}
                  >
                    <MessageCircle className="h-4 w-4" style={{ color }} />
                  </span>
                )}
              </div>

              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <p className="truncate text-2xl font-semibold tabular-nums">
                  {formatCurrency(revenue)}
                </p>
              )}

              <div className="space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${share}%`, backgroundColor: color }}
                  />
                </div>
                <p className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {orders.toLocaleString()} {orders === 1 ? 'order' : 'orders'}
                  </span>
                  <span className="tabular-nums">
                    {share.toFixed(share > 0 && share < 1 ? 1 : 0)}% of revenue
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
