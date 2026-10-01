'use client';

import { Copy, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { OrderTracking } from './types';
import { formatFriendlyDateTime } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { courierLabel as labelFor, courierTrackingUrl } from '../parcel-daily/couriers';

interface TrackingEntryCardProps {
  tracking: OrderTracking;
  onEdit?: () => void;
}

type Step = {
  label: string;
  detail: string;
  state: 'done' | 'pending' | 'failed';
};

function buildSteps(tracking: OrderTracking): Step[] {
  const messageStep: Step =
    tracking.message_status === 'sent'
      ? {
          label: 'Tracking sent to customer',
          detail: tracking.last_message_sent_at
            ? formatFriendlyDateTime(tracking.last_message_sent_at)
            : 'On WhatsApp',
          state: 'done',
        }
      : tracking.message_status === 'failed'
        ? { label: 'Tracking message failed', detail: 'Try sending it again', state: 'failed' }
        : { label: 'Tracking not sent yet', detail: 'Use Send tracking above', state: 'pending' };

  return [
    {
      label: 'Shipment created',
      detail: formatFriendlyDateTime(tracking.created_at),
      state: 'done',
    },
    messageStep,
    {
      label: tracking.status ? `Courier: ${tracking.status}` : 'Waiting for courier update',
      detail: tracking.status
        ? `Latest status · ${formatFriendlyDateTime(tracking.updated_at || tracking.created_at)}`
        : 'Updates appear here automatically',
      state: tracking.status ? 'done' : 'pending',
    },
  ];
}

export function TrackingEntryCard({ tracking, onEdit }: TrackingEntryCardProps) {
  const courier = tracking.courier as string | undefined;
  const courierLabel = labelFor(courier) || 'Courier';
  const trackingUrl = courierTrackingUrl(courier, tracking.tracking_number) ?? null;

  const copyTrackingNumber = async () => {
    try {
      await navigator.clipboard.writeText(tracking.tracking_number);
      toast.success('Tracking number copied');
    } catch {
      toast.error('Could not copy tracking number');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{courierLabel}</p>
          <button
            type="button"
            onClick={copyTrackingNumber}
            title="Copy tracking number"
            className="group mt-0.5 flex items-center gap-1.5 font-mono text-sm font-medium transition-colors hover:text-primary"
          >
            {tracking.tracking_number}
            <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {trackingUrl && (
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
              <a href={trackingUrl} target="_blank" rel="noreferrer">
                Track parcel
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label="Edit tracking"
              className="h-8 w-8 text-muted-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ol className="space-y-0">
        {buildSteps(tracking).map((step, index, steps) => (
          <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && (
              <span className="absolute left-[5px] top-4 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                'relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-card',
                step.state === 'done' && 'bg-primary',
                step.state === 'pending' && 'border-2 border-muted-foreground/30 bg-card',
                step.state === 'failed' && 'bg-red-500'
              )}
            />
            <div className="min-w-0 text-sm">
              <p
                className={cn(
                  'font-medium',
                  step.state === 'pending' && 'text-muted-foreground',
                  step.state === 'failed' && 'text-red-600'
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
