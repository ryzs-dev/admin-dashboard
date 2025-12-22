'use client';

import { UUID } from 'crypto';
import { TrackingEntryCard } from './TrackingEntryCard';
import { OrderTracking, OrderTrackingInput } from './types';
import { useState } from 'react';
import { UpdateTrackingDialog } from './UpdateTrackingDialog';

interface TrackingListProps {
  trackings: OrderTracking[];
  onUpdateTracking?: (
    trackingId: UUID,
    payload: Partial<OrderTrackingInput>
  ) => Promise<void>;
}

export function TrackingList({
  trackings,
  onUpdateTracking,
}: TrackingListProps) {
  const [selectedTracking, setSelectedTracking] =
    useState<OrderTracking | null>(null);

  if (!trackings || trackings.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No tracking entries available.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {trackings.map((tracking) => (
          <TrackingEntryCard
            key={tracking.id}
            tracking={tracking}
            onEdit={() => setSelectedTracking(tracking)}
          />
        ))}
      </div>

      {selectedTracking && onUpdateTracking && (
        <UpdateTrackingDialog
          open={!!selectedTracking}
          tracking={selectedTracking}
          onOpenChange={() => setSelectedTracking(null)}
          onSubmit={onUpdateTracking}
        />
      )}
    </>
  );
}
