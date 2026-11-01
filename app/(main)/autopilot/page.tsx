'use client';

import { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { PendingBatch } from '@/components/modules/autopilot/PendingBatch';
import { RulesCard } from '@/components/modules/autopilot/RulesCard';
import { RunLog } from '@/components/modules/autopilot/RunLog';
import { StepCard } from '@/components/modules/autopilot/StepCard';
import { formatClock } from '@/components/modules/autopilot/labels';
import { useAutopilotRuns, useAutopilotSettings } from '@/hooks/useAutopilot';
import { saveAutopilotSettings } from '@/lib/api/autopilot';
import { useAuth } from '@/providers/auth-providers';
import { AutopilotSettings } from '@/types/autopilot';

function statusLine(settings: AutopilotSettings) {
  if (!settings.enabled) {
    return 'Off. Orders are shipped and tracking is sent by hand from the Orders page.';
  }
  const steps: string[] = [];
  if (settings.ship_enabled) {
    steps.push(
      `ships new orders at ${formatClock(settings.ship_time)}${settings.ship_mode === 'review' ? ' after approval' : ''}`
    );
  }
  if (settings.tracking_enabled) {
    steps.push(
      `sends tracking at ${formatClock(settings.tracking_time)}${settings.tracking_mode === 'review' ? ' after approval' : ''}`
    );
  }
  return steps.length ? `On. Every day it ${steps.join(' and ')}.` : 'On, but both steps are switched off.';
}

export default function AutopilotPage() {
  const { user } = useAuth();
  const { settings, isLoading, isError, mutate } = useAutopilotSettings();
  const { runs, isLoading: runsLoading, mutate: mutateRuns } = useAutopilotRuns();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = async (patch: Partial<AutopilotSettings>) => {
    if (!settings) return;
    setSaveState('saving');
    // Show the change at once; roll back if the server refuses it.
    mutate({ ...settings, ...patch }, { revalidate: false });
    try {
      const saved = await saveAutopilotSettings({ ...patch, updated_by: user?.email ?? null });
      mutate(saved, { revalidate: false });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      mutate(settings, { revalidate: false });
      setSaveState('idle');
      toast.error(error instanceof Error ? error.message : 'Couldn’t save the setting');
    }
  };

  const waiting = runs.filter((run) => run.status === 'awaiting_approval');
  const lastRun = (step: 'ship' | 'tracking') =>
    runs.find((run) => run.step === step && run.status !== 'awaiting_approval');

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Autopilot"
          description={settings ? statusLine(settings) : 'Ships new orders and sends tracking numbers on a daily schedule.'}
        >
          {settings && (
            <div className="flex items-center gap-3">
              {saveState !== 'idle' && (
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  {saveState === 'saving' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Saved
                    </span>
                  )}
                </span>
              )}
              <label className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium">
                {settings.enabled ? 'Autopilot on' : 'Autopilot off'}
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(value) => save({ enabled: value })}
                  aria-label="Autopilot on or off"
                />
              </label>
            </div>
          )}
        </PageHeader>

        {isError ? (
          <Card className="items-center gap-2 px-6 py-16 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium">Couldn’t load Autopilot</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => mutate()}>
              Try again
            </Button>
          </Card>
        ) : isLoading || !settings ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        ) : (
          <>
            {waiting.map((run) => (
              <PendingBatch
                key={run.id}
                run={run}
                approvedBy={user?.email ?? undefined}
                onChanged={() => mutateRuns()}
              />
            ))}

            <div className="grid gap-4 lg:grid-cols-2">
              {(['ship', 'tracking'] as const).map((step) => (
                <StepCard
                  key={step}
                  step={step}
                  settings={settings}
                  lastRun={lastRun(step)}
                  onSave={save}
                  onRan={() => mutateRuns()}
                />
              ))}
            </div>

            <RulesCard settings={settings} onSave={save} />

            <RunLog runs={runs} isLoading={runsLoading} />
          </>
        )}
      </div>
    </div>
  );
}
