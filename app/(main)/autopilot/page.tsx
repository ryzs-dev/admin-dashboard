'use client';

import Link from 'next/link';
import { AlertCircle, Settings } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AutopilotSwitch,
  SaveState,
  autopilotStatusLine,
} from '@/components/modules/autopilot/AutopilotSwitch';
import { PendingBatch } from '@/components/modules/autopilot/PendingBatch';
import { RunLog } from '@/components/modules/autopilot/RunLog';
import { StepCard } from '@/components/modules/autopilot/StepCard';
import {
  useAutopilotRuns,
  useAutopilotSettings,
  useSaveAutopilotSettings,
} from '@/hooks/useAutopilot';
import { useAuth } from '@/providers/auth-providers';

export default function AutopilotPage() {
  const { user } = useAuth();
  const { settings, isLoading, isError, mutate } = useAutopilotSettings();
  const { save, saveState } = useSaveAutopilotSettings();
  const { runs, isLoading: runsLoading, mutate: mutateRuns } = useAutopilotRuns();

  const waiting = runs.filter((run) => run.status === 'awaiting_approval');
  const lastRun = (step: 'ship' | 'tracking') =>
    runs.find((run) => run.step === step && run.status !== 'awaiting_approval');

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Autopilot"
          description={
            settings
              ? autopilotStatusLine(settings)
              : 'Ships new orders and sends tracking numbers on a daily schedule.'
          }
        >
          <SaveState state={saveState} />
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          {settings && <AutopilotSwitch settings={settings} onSave={save} />}
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
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
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
                  variant="status"
                  settings={settings}
                  lastRun={lastRun(step)}
                  onRan={() => mutateRuns()}
                />
              ))}
            </div>

            <RunLog runs={runs} isLoading={runsLoading} />
          </>
        )}
      </div>
    </div>
  );
}
