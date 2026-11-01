'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutopilotSettings, useSaveAutopilotSettings } from '@/hooks/useAutopilot';
import { Segmented } from '../settings/Segmented';
import { AutopilotSwitch, autopilotStatusLine } from './AutopilotSwitch';
import { RulesCard } from './RulesCard';
import { StepCard } from './StepCard';

type Tab = 'ship' | 'tracking' | 'rules';

export function AutopilotSettings({
  onSaving,
}: {
  onSaving?: (state: 'idle' | 'saving' | 'saved') => void;
}) {
  const { settings, isLoading, isError, mutate } = useAutopilotSettings();
  const { save } = useSaveAutopilotSettings(onSaving);
  const [tab, setTab] = useState<Tab>('ship');

  if (isError) {
    return (
      <Card className="items-center gap-2 px-6 py-12 text-center">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <p className="text-sm font-medium">Couldn’t load Autopilot settings</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => mutate()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (isLoading || !settings) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Autopilot</p>
            <p className="text-sm text-muted-foreground">{autopilotStatusLine(settings)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/autopilot">
                Batches and run log
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <AutopilotSwitch settings={settings} onSave={save} />
          </div>
        </div>
      </Card>

      <Segmented
        label="Autopilot settings"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'ship', label: 'Ship orders' },
          { value: 'tracking', label: 'Send tracking' },
          { value: 'rules', label: 'Rules' },
        ]}
      />

      {tab === 'rules' ? (
        <RulesCard settings={settings} onSave={save} />
      ) : (
        <StepCard key={tab} step={tab} variant="settings" settings={settings} onSave={save} />
      )}
    </div>
  );
}
