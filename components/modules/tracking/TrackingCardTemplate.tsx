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
import { OrderTrackingInput } from './types';

interface TrackingCardTemplateProps {
  orderId: UUID;
}

export default function TrackingCardTemplate({
  orderId,
}: TrackingCardTemplateProps) {
  const { tracking, updateTracking, refreshOrderTracking } =
    useOrderTracking(orderId);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (payload: OrderTrackingInput) => {
    await createOrderTrackingByOrderId(orderId, payload);
    await refreshOrderTracking(); // refresh list
  };

  return (
    <Card id="tracking-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Shipping
          </CardTitle>

          {tracking.length === 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 bg-background" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add tracking manually
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {tracking && tracking.length > 0 ? (
          <TrackingList
            trackings={tracking}
            onUpdateTracking={updateTracking}
          />
        ) : (
          <div className="rounded-xl border border-dashed py-8 text-center">
            <Package className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">Not shipped yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a shipment to get a tracking number.
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
