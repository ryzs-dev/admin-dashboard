'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConverraStatus } from '@/hooks/useConverra';
import { startConverraSync } from '@/lib/api/converra';
import { formatFriendlyDateTime } from '@/lib/utils/date';

const integration = getIntegration('converra');

function InfoCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <dl className="mt-4 divide-y border-t">{children}</dl>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export default function ConverraIntegrationPage() {
  const badge = useIntegrationStatus('converra');
  const { status, isLoading, isError, refresh } = useConverraStatus();
  const [starting, setStarting] = useState(false);

  const sync = status?.sync;
  const summary = sync?.summary;
  const running = !!sync?.running;

  const handleSync = async () => {
    setStarting(true);
    try {
      const next = await startConverraSync();
      if (status) refresh({ ...status, sync: next }, { revalidate: true });
      toast.success('Sync started — customers are being sent to Converra');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        'Couldn’t start the sync';
      toast.error(message);
    } finally {
      setStarting(false);
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
              <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              className="gap-1.5"
              onClick={handleSync}
              disabled={!status?.connection?.ok || running || starting}
            >
              {running || starting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {running ? 'Syncing…' : 'Sync now'}
            </Button>
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
        ) : (
          <>
            {!status.configured && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Converra isn’t set up on the server yet. Add CONVERRA_API_URL,
                  CONVERRA_BUSINESS_ID and CONVERRA_BRIDGE_API_KEY to lunaa-agent and restart it.
                </p>
              </div>
            )}
            {status.connection && !status.connection.ok && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Converra rejected the connection: {status.connection.error}</p>
              </div>
            )}
            {sync?.error && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>The last sync stopped early: {sync.error}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Customers synced"
                icon={Users}
                value={summary ? summary.total.toLocaleString() : '—'}
                hint={
                  summary
                    ? `${summary.created.toLocaleString()} new · ${summary.updated.toLocaleString()} updated${
                        summary.failed ? ` · ${summary.failed} failed` : ''
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
                    : sync?.finishedAt
                      ? formatFriendlyDateTime(sync.finishedAt)
                      : 'Not yet'
                }
                hint="New and edited customers also sync automatically"
              />
            </div>

            <InfoCard
              icon={Link2}
              title="Connection"
              description="The back office sends customers to this Converra workspace."
            >
              <Row label="Converra server">{status.host ?? '—'}</Row>
              <Row label="Workspace ID">
                <span className="font-mono text-xs">{status.businessId ?? '—'}</span>
              </Row>
              <Row label="Last checked">
                {status.connection
                  ? `${status.connection.ok ? 'Reachable' : 'Rejected'} · ${formatFriendlyDateTime(
                      status.connection.checkedAt
                    )}`
                  : '—'}
              </Row>
            </InfoCard>

            <InfoCard
              icon={ShieldCheck}
              title="What syncs"
              description="Converra only messages customers in line with WhatsApp marketing rules."
            >
              <Row label="Customers">Name, phone and email, matched by phone number</Row>
              <Row label="Segments">Each segment becomes a tag, so broadcasts can target it</Row>
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
