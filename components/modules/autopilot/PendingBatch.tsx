'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  approveAutopilotRun,
  dismissAutopilotRun,
  setAutopilotHold,
} from '@/lib/api/autopilot';
import { AutopilotRun, RunItem } from '@/types/autopilot';
import { RunItemsTable } from './RunItemsTable';
import { STEP_LABELS, formatWhen, runOutcome } from './labels';

export function PendingBatch({
  run,
  approvedBy,
  onChanged,
}: {
  run: AutopilotRun;
  approvedBy?: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<'approve' | 'dismiss' | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const ready = run.summary.ready ?? 0;

  const act = async (kind: 'approve' | 'dismiss') => {
    setBusy(kind);
    try {
      if (kind === 'approve') {
        await approveAutopilotRun(run.id, approvedBy);
        toast.success(
          run.step === 'ship'
            ? `Shipping ${ready} ${ready === 1 ? 'order' : 'orders'} now`
            : `Sending ${ready} tracking ${ready === 1 ? 'message' : 'messages'} now`
        );
      } else {
        await dismissAutopilotRun(run.id);
        toast.success('Batch dismissed. Nothing was shipped or sent.');
      }
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const hold = async (item: RunItem, value: boolean) => {
    setBusyOrderId(item.order_id);
    try {
      await setAutopilotHold(item.order_id, value, run.id);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t change the hold');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden border-[#fde68a] py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-[#fffbeb] px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            {STEP_LABELS[run.step]} · waiting for approval
          </h2>
          <p className="text-xs text-[#92400e]">
            {runOutcome(run)} · prepared {formatWhen(run.created_at)}
            {run.trigger === 'manual' ? ' (Run now)' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => act('dismiss')}>
            {busy === 'dismiss' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Dismiss
          </Button>
          <Button size="sm" disabled={busy !== null || ready === 0} onClick={() => act('approve')}>
            {busy === 'approve' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {run.step === 'ship'
              ? `Approve and ship ${ready}`
              : `Approve and send ${ready}`}
          </Button>
        </div>
      </div>
      <RunItemsTable step={run.step} items={run.items} onHold={hold} busyOrderId={busyOrderId} />
    </Card>
  );
}
