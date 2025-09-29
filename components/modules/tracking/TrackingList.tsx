"use client";

import { TrackingEntryCard } from "./TrackingEntryCard";
import { OrderTracking } from "./types";

interface TrackingListProps {
  trackings: OrderTracking[];
}

export function TrackingList({ trackings }: TrackingListProps) {
  if (!trackings || trackings.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No tracking entries available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {trackings.map((tracking) => (
        <TrackingEntryCard key={tracking.id} tracking={tracking} />
      ))}
    </div>
  );
}
