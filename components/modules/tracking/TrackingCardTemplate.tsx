'use client';

import { UUID } from 'crypto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Plus } from 'lucide-react';
import { TrackingList } from './TrackingList';
import { useOrderTracking } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateTrackingDialog } from './CreateTrackingDialog';
import { createOrderTrackingByOrderId } from '@/lib/api/order';

interface TrackingCardTemplateProps {
  orderId: UUID;
}

export default function TrackingCardTemplate({
  orderId,
}: TrackingCardTemplateProps) {
  const { tracking, updateTracking, refreshOrderTracking } =
    useOrderTracking(orderId);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (payload: any) => {
    await createOrderTrackingByOrderId(orderId, payload);
    await refreshOrderTracking(); // refresh list
  };

  return (
    <Card id="tracking-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Truck className="h-4 w-4 text-gray-500" />
            Shipping
          </CardTitle>

          {!tracking ||
            (tracking.length === 0 && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tracking
              </Button>
            ))}
        </div>
      </CardHeader>

      <CardContent>
        {tracking && tracking.length > 0 ? (
          <TrackingList
            trackings={tracking}
            onUpdateTracking={updateTracking}
          />
        ) : (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              No tracking information
            </p>
          </div>
        )}
      </CardContent>

      <CreateTrackingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </Card>
  );
}
