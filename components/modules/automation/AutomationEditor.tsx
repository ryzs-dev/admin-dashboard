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
import { Clock, Zap, Plus, Trash2, Tag, Mail, Pencil, X } from 'lucide-react';
import { useWhatsappTemplates } from '@/hooks/useWhatsapp';
import { useToggleAutomation } from '@/hooks/useAutomation';
import { toast } from 'sonner';

const TRIGGER_EVENTS = ['order.created', 'user.view'];

const ACTION_TYPES = [
  { value: 'send_template', label: 'Send Template', icon: Mail },
  { value: 'tag_user', label: 'Tag User', icon: Tag },
];

function ActionRow({
  templates,
  action,
  editing,
  onChange,
  onRemove,
}: {
  templates: any[];
  action: any;
  editing: boolean;
  onChange: (updated: any) => void;
  onRemove: () => void;
}) {
  const Icon = ACTION_TYPES.find((t) => t.value === action.type)?.icon ?? Mail;
  const label =
    ACTION_TYPES.find((t) => t.value === action.type)?.label ?? action.type;
  const templateName =
    action.config?.templateName ?? action.config?.templateId ?? '—';
  const tagName = action.config?.tag ?? '—';

  if (!editing) {
    return (
      <div className="flex items-start gap-3 px-3 py-2.5 rounded-md border bg-card">
        <div className="mt-0.5 p-1 rounded bg-muted shrink-0">
          <Icon size={11} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm truncate">
            {action.type === 'send_template' ? templateName : tagName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-md border bg-card">
      <div className="mt-1 p-1 rounded bg-muted shrink-0">
        <Icon size={11} className="text-muted-foreground" />
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        <Select
          value={action.type}
          onValueChange={(val) => onChange({ type: val, config: {} })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {action.type === 'send_template' && (
          <Select
            value={action.config?.templateId ?? ''}
            onValueChange={(val) => {
              const tpl = templates.find((t) => t.id === val);
              onChange({
                ...action,
                config: { templateId: val, templateName: tpl?.name ?? '' },
              });
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Choose template…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {action.type === 'tag_user' && (
          <Input
            className="h-7 text-xs"
            placeholder="Tag name"
            value={action.config?.tag ?? ''}
            onChange={(e) =>
              onChange({ ...action, config: { tag: e.target.value } })
            }
          />
        )}
      </div>

      <button
        onClick={onRemove}
        className="mt-1 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

const emptyForm = {
  name: '',
  trigger_event: '',
  delay_seconds: 0,
  is_active: true,
  automation_actions: [],
};

export default function AutomationEditor({
  automation,
  isNew = false,
  onToggle,
  onSave,
}: {
  automation?: any;
  isNew?: boolean;
  onToggle?: () => void;
  onSave?: (updated: any) => void;
}) {
  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState(
    isNew
      ? emptyForm
      : {
          name: automation.name,
          trigger_event: automation.trigger_event,
          delay_seconds: automation.delay_seconds,
          is_active: automation.is_active,
          automation_actions: automation.automation_actions,
        }
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { templates } = useWhatsappTemplates();
  const { toggleAutomation, loading } = useToggleAutomation();

  function update(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateAction(i: number, updated: any) {
    const actions = [...form.automation_actions];
    actions[i] = updated;
    update({ automation_actions: actions });
  }

  function removeAction(i: number) {
    update({
      automation_actions: form.automation_actions.filter(
        (_: any, idx: number) => idx !== i
      ),
    });
  }

  function addAction() {
    update({
      automation_actions: [
        ...form.automation_actions,
        { type: '', config: {} },
      ],
    });
  }

  function handleCancel() {
    // reset to original
    setForm({
      name: automation.name,
      trigger_event: automation.trigger_event,
      delay_seconds: automation.delay_seconds,
      is_active: automation.is_active,
      automation_actions: automation.automation_actions,
    });
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    if (isNew) {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`/api/automations/${automation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setEditing(false);
    onSave?.(form);
  }

  async function handleToggle() {
    const next = !form.is_active;

    setForm((f) => ({ ...f, is_active: next }));

    try {
      await toggleAutomation({
        id: automation.id,
        is_active: next,
      });

      toast.success(`Automation ${next ? 'enabled' : 'disabled'}`);

      onToggle?.();
    } catch (err) {
      setForm((f) => ({ ...f, is_active: !next }));
      toast.error('Failed to toggle automation');
    }
  }

  const canSave = form.name.trim() && form.trigger_event;

  return (
    <div className="max-w-xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              className="text-base font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Automation name"
            />
          ) : (
            <h2 className="text-base font-semibold truncate">{form.name}</h2>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 pl-px">
            {isNew ? 'New automation' : 'Automation details'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle — always visible for existing automations */}
          {!isNew && (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="active-toggle"
                className="text-xs text-muted-foreground"
              >
                {form.is_active ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="active-toggle"
                checked={form.is_active}
                disabled={toggling}
                onCheckedChange={handleToggle}
              />
            </div>
          )}

          {/* Edit / Cancel button — existing automations only */}
          {!isNew && (
            <Button
              size="sm"
              variant={editing ? 'ghost' : 'outline'}
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => (editing ? handleCancel() : setEditing(true))}
            >
              {editing ? (
                <>
                  <X size={12} /> Cancel
                </>
              ) : (
                <>
                  <Pencil size={12} /> Edit
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Trigger */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Trigger
        </Label>
        {editing ? (
          <Select
            value={form.trigger_event}
            onValueChange={(val) => update({ trigger_event: val })}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-primary shrink-0" />
                <SelectValue placeholder="Choose a trigger…" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_EVENTS.map((t) => (
                <SelectItem key={t} value={t} className="text-sm">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border">
            <Zap size={13} className="text-primary shrink-0" />
            <span className="text-sm">{form.trigger_event || '—'}</span>
          </div>
        )}
      </div>

      {/* Delay */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Delay (seconds)
        </Label>
        {editing ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-transparent focus-within:ring-1 focus-within:ring-ring">
            <Clock size={13} className="text-muted-foreground shrink-0" />
            <input
              type="number"
              min={0}
              className="flex-1 text-sm bg-transparent outline-none"
              value={form.delay_seconds}
              onChange={(e) =>
                update({ delay_seconds: Number(e.target.value) })
              }
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border">
            <Clock size={13} className="text-muted-foreground shrink-0" />
            <span className="text-sm">
              {form.delay_seconds === 0
                ? 'Immediate'
                : `${form.delay_seconds}s`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Actions
          </Label>
          {editing && (
            <button
              onClick={addAction}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {form.automation_actions.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">
              No actions yet.
            </p>
          )}
          {form.automation_actions.map((action: any, i: number) => (
            <ActionRow
              key={i}
              templates={templates}
              action={action}
              editing={editing}
              onChange={(updated) => updateAction(i, updated)}
              onRemove={() => removeAction(i)}
            />
          ))}
        </div>
      </div>

      {/* Save — only shown when editing */}
      {editing && (
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Saving…' : isNew ? 'Create automation' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
