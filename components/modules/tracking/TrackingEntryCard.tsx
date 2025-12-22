'use client';

import { Package, Calendar, Hash, RefreshCcw, Pencil } from 'lucide-react';
import { OrderTracking } from './types';
import { formatDateUTC8 } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';

interface TrackingEntryCardProps {
  tracking: OrderTracking;
  onEdit?: () => void;
}

export function TrackingEntryCard({
  tracking,
  onEdit,
}: TrackingEntryCardProps) {
  return (
    <div className="rounded-xl border p-4 text-sm text-gray-700 space-y-3 relative">
      {/* Edit button (only if editable) */}
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="absolute top-3 right-3 h-8 w-8 text-gray-500 hover:text-gray-700"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {/* Courier & Tracking Number */}
      <div className="flex items-center justify-between pr-8">
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
