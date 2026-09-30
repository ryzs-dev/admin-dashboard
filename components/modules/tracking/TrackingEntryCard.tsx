'use client';

import { Pencil } from 'lucide-react';
import { OrderTracking } from './types';
import { formatDateUTC8 } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { COURIER_SERVICES } from '../parcel-daily/constants';

const COURIER_LABELS: Record<string, string> = Object.fromEntries(
  [...COURIER_SERVICES.Malaysia, ...COURIER_SERVICES.Singapore].map((courier) => [
    courier.value,
    courier.label,
  ])
);

interface TrackingEntryCardProps {
  tracking: OrderTracking;
  onEdit?: () => void;
}

export function TrackingEntryCard({ tracking, onEdit }: TrackingEntryCardProps) {
  return (
    <div className="rounded-xl border bg-background p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {(tracking.courier && COURIER_LABELS[tracking.courier]) || tracking.courier || 'Courier'}
          </p>
          <p className="mt-0.5 font-mono text-muted-foreground">{tracking.tracking_number}</p>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit tracking"
            className="h-8 w-8 shrink-0 text-muted-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 border-t pt-3 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <dt>Status</dt>
          <dd className="capitalize text-foreground">{tracking.status}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Created</dt>
          <dd>{formatDateUTC8(tracking.created_at)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Updated</dt>
          <dd>{formatDateUTC8(tracking.updated_at)}</dd>
        </div>
      </dl>
    </div>
  );
}
