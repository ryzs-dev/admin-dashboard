'use client';

import { Fragment, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AutopilotRun } from '@/types/autopilot';
import { RunItemsTable } from './RunItemsTable';
import { RUN_STATUSES, STEP_LABELS, TONE_CLASSES, formatWhen, runOutcome } from './labels';

const TH = 'px-3 py-2 text-xs font-medium text-muted-foreground';

export function RunLog({ runs, isLoading }: { runs: AutopilotRun[]; isLoading?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card className="gap-0 py-0">
      <div className="px-5 pt-5">
        <h2 className="text-sm font-semibold">Run log</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every run, scheduled or started by hand. Select one to see each order.</p>
      </div>
      <div className="relative mt-3 overflow-x-auto px-2 pb-2">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-8" />
              <th className={cn(TH, 'text-left')}>When</th>
              <th className={cn(TH, 'text-left')}>Step</th>
              <th className={cn(TH, 'text-left')}>Result</th>
              <th className={cn(TH, 'text-left')}>What happened</th>
              <th className={cn(TH, 'text-left')}>Approved by</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Loading runs…
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No runs yet. They appear here once Autopilot runs, or when someone presses Run now.
                </td>
              </tr>
            ) : (
              runs.map((run) => {
                const status = RUN_STATUSES[run.status];
                const open = openId === run.id;
                return (
                  <Fragment key={run.id}>
                    <tr
                      tabIndex={0}
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : run.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOpenId(open ? null : run.id);
                        }
                      }}
                      className="cursor-pointer border-b outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                    >
                      <td className="pl-3">
                        <ChevronRight
                          className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                        {formatWhen(run.created_at)}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {run.trigger === 'manual' ? 'Run now' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">{STEP_LABELS[run.step]}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex flex-none whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                            TONE_CLASSES[status.tone]
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {run.error ?? runOutcome(run)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                        {run.approved_by ??
                          (run.approved_at === null &&
                          (run.summary.shipped || run.summary.queued || run.summary.failed)
                            ? 'Automatic'
                            : '—')}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b bg-muted/20">
                        <td colSpan={6} className="pt-1">
                          <RunItemsTable step={run.step} items={run.items} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
