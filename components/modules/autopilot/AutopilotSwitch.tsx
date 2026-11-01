'use client';

import { Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AutopilotSettings } from '@/types/autopilot';
import { formatClock } from './labels';

export function autopilotStatusLine(settings: AutopilotSettings) {
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

export function SaveState({ state }: { state: 'idle' | 'saving' | 'saved' }) {
  if (state === 'idle') return null;
  return (
    <span className="text-xs text-muted-foreground" aria-live="polite">
      {state === 'saving' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <span className="inline-flex items-center gap-1">
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )}
    </span>
  );
}

// The master switch: off means everything goes back to the manual buttons.
export function AutopilotSwitch({
  settings,
  onSave,
}: {
  settings: AutopilotSettings;
  onSave: (patch: Partial<AutopilotSettings>) => Promise<void>;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium">
      {settings.enabled ? 'Autopilot on' : 'Autopilot off'}
      <Switch
        checked={settings.enabled}
        onCheckedChange={(value) => onSave({ enabled: value })}
        aria-label="Autopilot on or off"
      />
    </label>
  );
}
