'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BadgeCheck, CalendarIcon, Mail, Users, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useFetchSegments } from '@/hooks/useAudience';
import { useWhatsappTemplates } from '@/hooks/useWhatsapp';
import { useCreateBroadcast } from '@/hooks/useBroadcast';

type BroadcastForm = {
  name: string;
  templateId: string;
  templateName: string;
  segmentId: string;
  status: 'draft' | 'scheduled';
};

const emptyForm: BroadcastForm = {
  name: '',
  templateId: '',
  templateName: '',
  segmentId: '',
  status: 'draft',
};

export default function BroadcastForm({ onSave }: { onSave?: () => void }) {
  const { segments } = useFetchSegments();
  const { templates } = useWhatsappTemplates();
  const { createBroadcast, isCreating } = useCreateBroadcast();

  const [form, setForm] = useState(emptyForm);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('09:00');

  function update(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const canSubmit =
    form.name.trim() &&
    form.templateId &&
    form.segmentId &&
    form.status &&
    (!scheduled || scheduleDate);

  async function handleSubmit() {
    let scheduledAt: string | null = null;
    if (scheduled && scheduleDate) {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const dt = new Date(scheduleDate);
      dt.setHours(hours, minutes, 0, 0);
      scheduledAt = dt.toISOString();
    }

    await createBroadcast({
      name: form.name,
      template_name: form.templateName,
      template_id: form.templateId,
      segment_id: form.segmentId,
      status: form.status,
      scheduled_at: scheduledAt,
    });

    onSave?.();
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Broadcast name
        </Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. May Promo Blast"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      {/* Template */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Template
        </Label>
        <Select
          value={form.templateId}
          onValueChange={(val) => {
            const tpl = templates?.find((t: any) => t.id === val);
            update({ templateId: val, templateName: tpl?.name ?? '' });
          }}
        >
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-muted-foreground shrink-0" />
              <SelectValue placeholder="Choose a template…" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {templates?.map((t: any) => (
              <SelectItem key={t.id} value={t.id} className="text-sm">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audience */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Audience
        </Label>
        <Select
          value={form.segmentId}
          onValueChange={(val) => update({ segmentId: val })}
        >
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2">
              <Users size={13} className="text-muted-foreground shrink-0" />
              <SelectValue placeholder="Choose a segment…" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {segments?.map((seg: any) => (
              <SelectItem key={seg.id} value={seg.id} className="text-sm">
                {seg.name}
                <span className="text-muted-foreground ml-1.5">
                  ({seg.member_count ?? 0})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Schedule toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Schedule for later</p>
            <p className="text-xs text-muted-foreground">
              {scheduled
                ? 'Pick a date and time below'
                : 'Send immediately on create'}
            </p>
          </div>
        </div>
        <Switch
          checked={scheduled}
          onCheckedChange={(val) => {
            setScheduled(val);

            update({
              status: val ? 'scheduled' : 'draft',
            });
          }}
        />{' '}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BadgeCheck size={13} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Broadcast status</p>
            <p className="text-xs text-muted-foreground">
              {form.status === 'scheduled'
                ? 'Scheduled (will be sent at selected time)'
                : 'Draft (won’t be sent)'}
            </p>
          </div>
        </div>

        <Switch
          checked={form.status === 'scheduled'}
          onCheckedChange={(val) =>
            update({ status: val ? 'scheduled' : 'draft' })
          }
        />
      </div>

      {scheduled && (
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm justify-start gap-2 font-normal"
              >
                <CalendarIcon size={13} className="text-muted-foreground" />
                {scheduleDate
                  ? format(scheduleDate, 'dd MMM yyyy')
                  : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduleDate}
                onSelect={setScheduleDate}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 px-3 py-2 rounded-md border w-32 focus-within:ring-1 focus-within:ring-ring">
            <input
              type="time"
              className="flex-1 text-sm bg-transparent outline-none"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="pt-1">
        <Button
          className="w-full"
          size="sm"
          disabled={!canSubmit || isCreating}
          onClick={handleSubmit}
        >
          {isCreating
            ? 'Creating…'
            : scheduled
              ? `Schedule for ${scheduleDate ? format(scheduleDate, 'dd MMM') : '…'} at ${scheduleTime}`
              : 'Create broadcast'}
        </Button>
      </div>
    </div>
  );
}
