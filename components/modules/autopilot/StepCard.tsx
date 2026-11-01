'use client';

import { useEffect, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAutopilotPreview } from '@/hooks/useAutopilot';
import { runAutopilotStep } from '@/lib/api/autopilot';
import { cn } from '@/lib/utils';
import { AutopilotMode, AutopilotRun, AutopilotSettings, AutopilotStep } from '@/types/autopilot';
import { STEP_LABELS, formatClock, formatWhen, runOutcome } from './labels';

const DESCRIPTIONS: Record<AutopilotStep, string> = {
  ship: 'Books Parcel Daily shipments for new WhatsApp orders, using your Parcel Daily courier and pickup settings.',
  tracking: 'Sends each customer their tracking number on WhatsApp once the shipment has one.',
};

// 'settings' edits the step (Settings page); 'status' summarises it and offers
// Run now (Autopilot page).
export function StepCard({
  step,
  settings,
  variant,
  lastRun,
  onSave,
  onRan,
}: {
  step: AutopilotStep;
  settings: AutopilotSettings;
  variant: 'settings' | 'status';
  lastRun?: AutopilotRun;
  onSave?: (patch: Partial<AutopilotSettings>) => Promise<void>;
  onRan?: () => void;
}) {
  const enabledKey = step === 'ship' ? 'ship_enabled' : 'tracking_enabled';
  const timeKey = step === 'ship' ? 'ship_time' : 'tracking_time';
  const modeKey = step === 'ship' ? 'ship_mode' : 'tracking_mode';
  const on = settings[enabledKey];
  const mode = settings[modeKey];

  const [time, setTime] = useState(settings[timeKey]);
  const [running, setRunning] = useState(false);
  const { items, isLoading, mutate } = useAutopilotPreview(step);

  useEffect(() => setTime(settings[timeKey]), [settings, timeKey]);

  const ready = items.filter((i) => i.state === 'ready').length;
  const attention = items.filter((i) => i.state === 'needs_attention').length;
  const held = items.filter((i) => i.state === 'on_hold').length;

  const runNow = async () => {
    setRunning(true);
    try {
      const run = await runAutopilotStep(step);
      toast.success(
        run.status === 'awaiting_approval'
          ? 'Batch ready. Review it at the top of the page.'
          : run.status === 'completed'
            ? runOutcome(run)
            : 'Running now'
      );
      onRan?.();
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Couldn’t start the run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className={cn('gap-0 py-0', !on && variant === 'settings' && 'bg-muted/30')}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{STEP_LABELS[step]}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{DESCRIPTIONS[step]}</p>
        </div>
        {variant === 'settings' ? (
          <Switch
            checked={on}
            onCheckedChange={(value) => onSave?.({ [enabledKey]: value })}
            aria-label={`${STEP_LABELS[step]} on or off`}
          />
        ) : (
          <span
            className={cn(
              'flex-none whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
              on && settings.enabled ? 'bg-[#dcfae5] text-[#04250e]' : 'bg-gray-100 text-gray-700'
            )}
          >
            {!on ? 'Off' : settings.enabled ? 'On' : 'Paused'}
          </span>
        )}
      </div>

      {variant === 'status' ? (
        <p className="mt-3 px-5 text-sm">
          {on
            ? `Every day at ${formatClock(settings[timeKey])}, ${mode === 'review' ? 'waits for approval' : 'runs automatically'}`
            : 'Switched off in Settings'}
        </p>
      ) : (
      <div className="mt-4 grid gap-4 px-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${step}-time`} className="text-sm font-medium">
            Every day at
          </label>
          <Input
            id={`${step}-time`}
            type="time"
            value={time}
            disabled={!on}
            onChange={(e) => setTime(e.target.value)}
            onBlur={() => time && time !== settings[timeKey] && onSave?.({ [timeKey]: time })}
            className="w-36 tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">When it runs</p>
          <div role="radiogroup" aria-label="When it runs" className="inline-flex rounded-md bg-muted p-0.5 text-xs">
            {(
              [
                ['review', 'Wait for approval'],
                ['auto', 'Run automatically'],
              ] as [AutopilotMode, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                disabled={!on}
                onClick={() => mode !== value && onSave?.({ [modeKey]: value })}
                className={cn(
                  'rounded px-2.5 py-1.5 font-medium transition-colors disabled:opacity-50',
                  mode === value ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>
            {isLoading ? (
              'Checking orders…'
            ) : (
              <>
                <span className="font-medium text-foreground tabular-nums">{ready}</span>{' '}
                {step === 'ship'
                  ? `${ready === 1 ? 'order' : 'orders'} would ship right now`
                  : `tracking ${ready === 1 ? 'number' : 'numbers'} would send right now`}
                {attention > 0 && ` · ${attention} need attention`}
                {held > 0 && ` · ${held} on hold`}
              </>
            )}
          </p>
          <p>
            {settings.enabled && on
              ? `Next: ${formatClock(settings[timeKey])}${mode === 'review' ? ', then waits for approval' : ''}`
              : 'Not scheduled'}
            {lastRun && ` · Last run ${formatWhen(lastRun.created_at)}`}
          </p>
        </div>
        {variant === 'status' && (
          <Button variant="outline" size="sm" className="gap-1.5" disabled={running} onClick={runNow}>
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run now
          </Button>
        )}
      </div>
    </Card>
  );
}
