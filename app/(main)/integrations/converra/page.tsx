'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  ExternalLink,
  History,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Unplug,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatCard } from '@/components/layout/StatCard';
import {
  IntegrationLogo,
  IntegrationStatusBadge,
  useIntegrationStatus,
} from '@/components/modules/integrations/IntegrationBits';
import { getIntegration } from '@/components/modules/integrations/registry';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConverraSegments, useConverraStatus, useConverraSyncRuns } from '@/hooks/useConverra';
import {
  ConverraSettings,
  ConverraStatus,
  ConverraSyncRun,
  converraErrorMessage,
  disconnectConverra,
  startConverraConnect,
  startConverraSync,
  updateConverraSettings,
} from '@/lib/api/converra';
import { cn } from '@/lib/utils';
import { formatFriendlyDateTime } from '@/lib/utils/date';

const integration = getIntegration('converra');

function InfoCard({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-4 divide-y border-t">{children}</div>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

function SettingRow({
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {title}
        </Label>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

function ConnectButton({ label = 'Connect to Converra', variant = 'default' }: {
  label?: string;
  variant?: 'default' | 'outline';
}) {
  const [connecting, setConnecting] = useState(false);
  const connect = async () => {
    setConnecting(true);
    try {
      const { authorizeUrl } = await startConverraConnect();
      window.location.assign(authorizeUrl);
    } catch (err) {
      toast.error(converraErrorMessage(err, 'Couldn’t start connecting to Converra'));
      setConnecting(false);
    }
  };
  return (
    <Button className="gap-1.5" variant={variant} onClick={connect} disabled={connecting}>
      {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

function NotConnected() {
  return (
    <Card className="gap-0 py-0">
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Connect your Converra workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to Converra, pick the workspace to send customers to and approve access. You need
            to be an owner or admin of that workspace.
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          {[
            'Customers sync as WhatsApp contacts, matched by phone number',
            'Segments become tags, so Converra broadcasts can target them',
            'New and edited customers keep syncing automatically',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {item}
            </li>
          ))}
        </ul>
        <ConnectButton />
      </div>
    </Card>
  );
}

function SegmentPicker({
  selected,
  disabled,
  onChange,
}: {
  selected: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
}) {
  const { segments, isLoading, isError } = useConverraSegments();
  const byId = new Map((segments ?? []).map((segment) => [segment.id, segment]));

  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...selected, id] : selected.filter((value) => value !== id));
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal sm:w-80"
            disabled={disabled}
          >
            {selected.length
              ? `${selected.length} segment${selected.length === 1 ? '' : 's'} selected`
              : 'Choose segments'}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          {isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : isError ? (
            <p className="p-3 text-sm text-red-600">Couldn’t load segments</p>
          ) : !segments?.length ? (
            <p className="p-3 text-sm text-muted-foreground">
              No segments yet — create them under Segments.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1">
              {segments.map((segment) => {
                const checked = selected.includes(segment.id);
                return (
                  <label
                    key={segment.id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggle(segment.id, value === true)}
                    />
                    <span className="min-w-0 flex-1 truncate">{segment.name}</span>
                    {segment.customerCount !== undefined && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {segment.customerCount.toLocaleString()}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <span
              key={id}
              className="inline-flex items-center rounded-full border bg-gray-50 px-2 py-0.5 text-xs"
            >
              {byId.get(id)?.name ?? (isLoading ? '…' : 'Deleted segment')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncSettingsCard({
  settings,
  onSave,
}: {
  settings: ConverraSettings;
  onSave: (patch: Partial<ConverraSettings>) => void;
}) {
  // "Only selected segments" with nothing picked yet stays local until a segment is chosen.
  const [pickingSegments, setPickingSegments] = useState(false);
  const mode = settings.segmentIds !== null || pickingSegments ? 'selected' : 'all';

  return (
    <InfoCard
      icon={Settings2}
      title="Sync settings"
      description="Choose what the back office sends to Converra."
    >
      <SettingRow
        id="converra-auto-sync"
        title="Auto-sync"
        description="Send customers to Converra as soon as they’re added or edited."
        checked={settings.autoSync}
        onChange={(autoSync) => onSave({ autoSync })}
      />
      <SettingRow
        id="converra-sync-segments"
        title="Send segments as tags"
        description="Each segment a customer is in becomes a Converra tag."
        checked={settings.syncSegments}
        onChange={(syncSegments) => onSave({ syncSegments })}
      />
      <SettingRow
        id="converra-sync-email"
        title="Send email addresses"
        description="Off sends only name and phone number."
        checked={settings.syncEmail}
        onChange={(syncEmail) => onSave({ syncEmail })}
      />
      <div className="space-y-3 px-5 py-4">
        <div>
          <p className="text-sm font-medium">Customers to sync</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Applies to Sync now and to auto-sync.
          </p>
        </div>
        <RadioGroup
          value={mode}
          onValueChange={(value) => {
            if (value === 'all') {
              setPickingSegments(false);
              if (settings.segmentIds !== null) onSave({ segmentIds: null });
            } else {
              setPickingSegments(true);
            }
          }}
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all" id="converra-all-customers" />
            <Label htmlFor="converra-all-customers" className="font-normal">
              All customers
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="selected" id="converra-selected-segments" />
            <Label htmlFor="converra-selected-segments" className="font-normal">
              Only selected segments
            </Label>
          </div>
        </RadioGroup>
        {mode === 'selected' && (
          <div className="pl-6">
            <SegmentPicker
              selected={settings.segmentIds ?? []}
              onChange={(ids) => {
                if (ids.length === 0) {
                  toast.error('Keep at least one segment, or choose All customers');
                  return;
                }
                onSave({ segmentIds: ids });
              }}
            />
            {settings.segmentIds === null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Pick at least one segment — until then all customers sync.
              </p>
            )}
          </div>
        )}
      </div>
    </InfoCard>
  );
}

const RUN_STATUS: Record<ConverraSyncRun['status'], { label: string; className: string }> = {
  running: { label: 'Running', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  succeeded: { label: 'Succeeded', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', className: 'border-red-200 bg-red-50 text-red-700' },
};

function RunStatusBadge({ run }: { run: ConverraSyncRun }) {
  const style = RUN_STATUS[run.status];
  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        style.className
      )}
    >
      {run.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
      {style.label}
      {run.error && <Info className="h-3 w-3" />}
    </span>
  );
  if (!run.error) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help">
          {badge}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal">{run.error}</TooltipContent>
    </Tooltip>
  );
}

function runResult(run: ConverraSyncRun) {
  const parts = [`${run.total.toLocaleString()} sent`];
  if (run.created) parts.push(`${run.created.toLocaleString()} new`);
  if (run.updated) parts.push(`${run.updated.toLocaleString()} updated`);
  if (run.failed) parts.push(`${run.failed.toLocaleString()} failed`);
  if (run.withoutPhone) parts.push(`${run.withoutPhone.toLocaleString()} without phone`);
  return parts.join(' · ');
}

function SyncHistoryCard() {
  const { runs, isLoading, isError, refresh } = useConverraSyncRuns();

  return (
    <InfoCard icon={History} title="Sync history" description="Full syncs to Converra, newest first.">
      {isError ? (
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
          <span className="text-red-600">Couldn’t load the sync history</span>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Try again
          </Button>
        </div>
      ) : isLoading || !runs ? (
        <div className="space-y-2 px-5 py-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      ) : runs.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          No syncs yet — run Sync now to send all customers.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">When</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Started by</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="pl-5 whitespace-nowrap">
                  {formatFriendlyDateTime(run.startedAt)}
                </TableCell>
                <TableCell>{run.trigger === 'connect' ? 'After connecting' : 'Sync now'}</TableCell>
                <TableCell className="max-w-[180px] truncate">{run.startedBy ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{runResult(run)}</TableCell>
                <TableCell className="pr-5">
                  <RunStatusBadge run={run} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </InfoCard>
  );
}

function DisconnectButton({ workspace, onDisconnected }: {
  workspace: string;
  onDisconnected: (status: ConverraStatus) => void;
}) {
  const [busy, setBusy] = useState(false);
  const disconnect = async () => {
    setBusy(true);
    try {
      const next = await disconnectConverra();
      onDisconnected(next);
      toast.success('Converra disconnected');
    } catch (err) {
      toast.error(converraErrorMessage(err, 'Couldn’t disconnect Converra'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700">
          <Unplug className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Converra?</AlertDialogTitle>
          <AlertDialogDescription>
            Customers will stop syncing to {workspace}. Contacts already in Converra stay there. You
            can connect again at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void disconnect();
            }}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ConverraIntegrationPage() {
  const badge = useIntegrationStatus('converra');
  const { status, isLoading, isError, refresh } = useConverraStatus();
  const { refresh: refreshRuns } = useConverraSyncRuns(!!status?.connected);
  const [starting, setStarting] = useState(false);

  const connected = !!status?.connected;
  const running = !!status?.sync.running;
  const current = status?.sync.current ?? null;
  const last = status?.sync.last ?? null;
  const workspace = status?.workspaceName ?? 'your Converra workspace';

  const handleSync = async () => {
    setStarting(true);
    try {
      const run = await startConverraSync();
      if (status) {
        refresh({ ...status, sync: { ...status.sync, running: true, current: run } }, { revalidate: true });
      }
      refreshRuns();
      toast.success('Sync started — customers are being sent to Converra');
    } catch (err) {
      toast.error(converraErrorMessage(err, 'Couldn’t start the sync'));
      refresh();
    } finally {
      setStarting(false);
    }
  };

  const saveSettings = async (patch: Partial<ConverraSettings>) => {
    try {
      await refresh(
        async (latest) => {
          const settings = await updateConverraSettings(patch);
          return latest ? { ...latest, settings } : latest;
        },
        {
          optimisticData: (latest) =>
            latest ? { ...latest, settings: { ...latest.settings, ...patch } } : (latest as never),
          rollbackOnError: true,
          revalidate: false,
        }
      );
      toast.success('Sync settings saved');
    } catch (err) {
      toast.error(converraErrorMessage(err, 'Couldn’t save the sync settings'));
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Integrations
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <IntegrationLogo integration={integration} size={52} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{integration.name}</h1>
                <IntegrationStatusBadge status={badge} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {connected && status?.workspaceName
                  ? `Syncing to ${status.workspaceName}`
                  : integration.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {connected && (
              <Button className="gap-1.5" onClick={handleSync} disabled={running || starting}>
                {running || starting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {running ? 'Syncing…' : 'Sync now'}
              </Button>
            )}
            {integration.portalUrl && (
              <Button variant="outline" asChild className="gap-1.5">
                <a href={integration.portalUrl} target="_blank" rel="noreferrer">
                  Open Converra
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {isError ? (
          <Card className="items-center gap-2 px-6 py-16 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium">Couldn’t load the Converra connection</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
              Try again
            </Button>
          </Card>
        ) : isLoading || !status ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !connected ? (
          <NotConnected />
        ) : (
          <>
            {status.source === 'env' && (
              <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Connected through server settings — reconnect to manage it here.</p>
                </div>
                <ConnectButton label="Connect" variant="outline" />
              </div>
            )}
            {status.connection && !status.connection.ok && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Converra rejected the connection: {status.connection.error}</p>
              </div>
            )}
            {!running && last?.status === 'failed' && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>The last sync stopped early: {last.error ?? 'unknown error'}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Customers synced"
                icon={Users}
                value={
                  running && current
                    ? current.total.toLocaleString()
                    : last
                      ? last.total.toLocaleString()
                      : '—'
                }
                hint={
                  running
                    ? 'Sync in progress…'
                    : last
                      ? `${last.created.toLocaleString()} new · ${last.updated.toLocaleString()} updated${
                          last.failed ? ` · ${last.failed} failed` : ''
                        }`
                      : 'Run Sync now to send all customers'
                }
              />
              <StatCard
                label="Last full sync"
                icon={RefreshCw}
                value={
                  running
                    ? 'Running…'
                    : last?.finishedAt
                      ? formatFriendlyDateTime(last.finishedAt)
                      : 'Not yet'
                }
                hint={
                  status.settings.autoSync
                    ? 'New and edited customers also sync automatically'
                    : 'Auto-sync is off — only Sync now sends customers'
                }
              />
            </div>

            <SyncSettingsCard settings={status.settings} onSave={saveSettings} />

            <SyncHistoryCard />

            <InfoCard
              icon={Link2}
              title="Connection"
              description="The back office sends customers to this Converra workspace."
              action={
                <DisconnectButton
                  workspace={workspace}
                  onDisconnected={(next) => refresh(next, { revalidate: false })}
                />
              }
            >
              <Row label="Workspace">{status.workspaceName ?? '—'}</Row>
              <Row label="Workspace ID">
                <span className="font-mono text-xs">{status.businessId ?? '—'}</span>
              </Row>
              <Row label="Connected by">
                {status.source === 'env'
                  ? 'Server settings'
                  : [status.connectedBy, status.connectedAt && formatFriendlyDateTime(status.connectedAt)]
                      .filter(Boolean)
                      .join(' · ') || '—'}
              </Row>
              <Row label="Converra server">{status.host ?? '—'}</Row>
              <Row label="Health">
                {status.connection ? (
                  <span className={status.connection.ok ? 'text-emerald-700' : 'text-red-700'}>
                    {status.connection.ok ? 'Reachable' : 'Rejected'}
                    <span className="text-muted-foreground">
                      {' '}
                      · checked {formatFriendlyDateTime(status.connection.checkedAt)}
                    </span>
                  </span>
                ) : (
                  '—'
                )}
              </Row>
            </InfoCard>

            <InfoCard
              icon={ShieldCheck}
              title="What syncs"
              description="Converra only messages customers in line with WhatsApp marketing rules."
            >
              <Row label="Customers">
                Name, phone{status.settings.syncEmail ? ' and email' : ''}, matched by phone number
              </Row>
              <Row label="Segments">
                {status.settings.syncSegments
                  ? 'Each segment becomes a tag, so broadcasts can target it'
                  : 'Not sent'}
              </Row>
              <Row label="Opt-outs">
                Customers who reply STOP on WhatsApp are never sent marketing messages
              </Row>
            </InfoCard>
          </>
        )}
      </div>
    </div>
  );
}
