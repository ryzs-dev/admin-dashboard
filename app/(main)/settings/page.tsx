'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AutopilotSwitch,
  SaveState,
  autopilotStatusLine,
} from '@/components/modules/autopilot/AutopilotSwitch';
import { RulesCard } from '@/components/modules/autopilot/RulesCard';
import { StepCard } from '@/components/modules/autopilot/StepCard';
import { useAutopilotSettings, useSaveAutopilotSettings } from '@/hooks/useAutopilot';
import { ReceiptSettingsSection } from '@/components/modules/receipts/ReceiptSettings';

export default function SettingsPage() {
  const { settings, isLoading, isError, mutate } = useAutopilotSettings();
  const { save, saveState } = useSaveAutopilotSettings();
  const [receiptSave, setReceiptSave] = useState<'idle' | 'saving' | 'saved'>('idle');

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Settings" description="How the back office runs. Changes save as you make them.">
          <SaveState state={saveState !== 'idle' ? saveState : receiptSave} />
        </PageHeader>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Autopilot</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {settings
                  ? autopilotStatusLine(settings)
                  : 'Ships new orders and sends tracking numbers on a daily schedule.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/autopilot">
                  Batches and run log
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {settings && <AutopilotSwitch settings={settings} onSave={save} />}
            </div>
          </div>

          {isError ? (
            <Card className="items-center gap-2 px-6 py-16 text-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm font-medium">Couldn’t load Autopilot settings</p>
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
              <div className="grid gap-4 lg:grid-cols-2">
                {(['ship', 'tracking'] as const).map((step) => (
                  <StepCard key={step} step={step} variant="settings" settings={settings} onSave={save} />
                ))}
              </div>
              <RulesCard settings={settings} onSave={save} />
            </>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Receipts</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Payment receipts staff send on WhatsApp with each order.
            </p>
          </div>
          <ReceiptSettingsSection onSaving={setReceiptSave} />
        </section>
      </div>
    </div>
  );
}
