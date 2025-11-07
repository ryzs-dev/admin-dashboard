'use client';

import { UUID } from 'crypto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Package, Truck } from 'lucide-react';
import { TrackingList } from './TrackingList';
import { useOrderTracking } from '@/hooks/useOrders';

interface TrackingCardTemplateProps {
  orderId: UUID;
}

export default function TrackingCardTemplate({
  orderId,
}: TrackingCardTemplateProps) {
  const { tracking } = useOrderTracking(orderId);

  return (
    <Card id="tracking-card">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Truck className="h-4 w-4 text-gray-500" />
            Shipping
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {tracking && tracking.length > 0 ? (
          <TrackingList trackings={tracking} />
        ) : (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              No tracking information
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
