"use client";

import { Package, Calendar, Hash, RefreshCcw } from "lucide-react";
import { OrderTracking } from "./types";
import { formatDateUTC8 } from "@/lib/utils/date";

interface TrackingEntryCardProps {
  tracking: OrderTracking;
}

export function TrackingEntryCard({ tracking }: TrackingEntryCardProps) {
  return (
    <div className="rounded-xl border p-4 text-sm text-gray-700 space-y-3">
      {/* Courier & Tracking Number */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span>{tracking.courier}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Hash className="h-4 w-4" />
          <span>{tracking.tracking_number}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-gray-500" />
        <span className="capitalize">{tracking.status}</span>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created: {formatDateUTC8(tracking.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          <span>Updated: {formatDateUTC8(tracking.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
