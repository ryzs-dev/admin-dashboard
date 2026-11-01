import { AutopilotRun, AutopilotStep, ItemState, RunStatus } from '@/types/autopilot';

export const STEP_LABELS: Record<AutopilotStep, string> = {
  ship: 'Ship new orders',
  tracking: 'Send tracking numbers',
};

export const ITEM_STATES: Record<ItemState, { label: string; tone: 'neutral' | 'good' | 'warn' | 'bad' }> = {
  ready: { label: 'Ready', tone: 'neutral' },
  needs_attention: { label: 'Needs attention', tone: 'warn' },
  on_hold: { label: 'On hold', tone: 'neutral' },
  over_limit: { label: 'Next run', tone: 'neutral' },
  shipped: { label: 'Shipped', tone: 'good' },
  queued: { label: 'Sent to WhatsApp', tone: 'good' },
  skipped: { label: 'Skipped', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'bad' },
};

export const RUN_STATUSES: Record<RunStatus, { label: string; tone: 'neutral' | 'good' | 'warn' | 'bad' }> = {
  awaiting_approval: { label: 'Waiting for approval', tone: 'warn' },
  running: { label: 'Running', tone: 'neutral' },
  completed: { label: 'Done', tone: 'good' },
  failed: { label: 'Failed', tone: 'bad' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
};

export const TONE_CLASSES = {
  neutral: 'bg-gray-100 text-gray-700',
  good: 'bg-[#dcfae5] text-[#04250e]',
  warn: 'bg-[#fffbeb] text-[#92400e] ring-1 ring-inset ring-[#fde68a]',
  bad: 'bg-[#ffedea] text-[#831c1e]',
};

// "6 shipped · 1 needs attention" from a run's counts, in a fixed order.
export function runOutcome(run: AutopilotRun) {
  const s = run.summary;
  const parts: string[] = [];
  const add = (n: number | undefined, label: string) => {
    if (n) parts.push(`${n} ${label}`);
  };
  if (run.status === 'awaiting_approval') {
    add(s.ready, run.step === 'ship' ? 'ready to ship' : 'ready to send');
  } else if (run.status === 'dismissed') {
    parts.push(
      `Nothing ${run.step === 'ship' ? 'shipped' : 'sent'}${s.ready ? ` (${s.ready} were ready)` : ''}`
    );
  } else {
    add(s.shipped, 'shipped');
    add(s.queued, 'sent');
    add(s.failed, 'failed');
    add(s.skipped, 'skipped');
  }
  add(s.needs_attention, 'need attention');
  add(s.on_hold, 'on hold');
  add(s.over_limit, 'left for the next run');
  if (!parts.length) return run.step === 'ship' ? 'No new orders to ship' : 'No tracking numbers to send';
  return parts.join(' · ');
}

export function formatClock(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
