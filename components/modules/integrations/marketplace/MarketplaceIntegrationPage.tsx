'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  LogIn,
  RefreshCw,
  ShoppingBag,
  Store,
  Unplug,
} from 'lucide-react';
import { toast } from 'sonner';
import DeleteDialog from '@/components/modules/alert/DeleteDialog';
import {
  IntegrationLogo,
  IntegrationStatusBadge,
  useIntegrationStatus,
} from '@/components/modules/integrations/IntegrationBits';
import { getIntegration } from '@/components/modules/integrations/registry';
import { errorMessage } from '@/components/forms/FormDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketplaceOrders, useMarketplaces, useSheetSync } from '@/hooks/useMarketplaces';
import {
  disconnectMarketplaceShop,
  Marketplace,
  MarketplaceConnection,
  marketplaceConnectUrl,
  runSheetSync,
  syncMarketplaceShop,
} from '@/lib/api/marketplaces';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDateTime } from '@/lib/utils/date';

const PAGE_SIZE = 20;

const NAMES: Record<Marketplace, string> = { shopee: 'Shopee', lazada: 'Lazada' };

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (['completed', 'delivered', 'confirmed'].includes(s)) return 'bg-emerald-50 text-emerald-700';
  if (s.includes('cancel') || ['returned', 'to_return', 'failed', 'lost'].includes(s)) {
    return 'bg-gray-100 text-gray-600';
  }
  if (['shipped', 'shipping', 'to_confirm_receive'].includes(s)) return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

const statusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function SetupNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-1 text-amber-800">{children}</div>
      </div>
    </div>
  );
}

const ROW_COLOURS: Record<Marketplace, { label: string; swatch: string }> = {
  shopee: { label: 'Orange', swatch: '#ff9900' },
  lazada: { label: 'Dark-blue', swatch: '#4a86e8' },
};

function SheetSyncCard({ platform }: { platform: Marketplace }) {
  const { sync, isLoading, isError, refresh } = useSheetSync();
  const [syncing, setSyncing] = useState(false);
  const colour = ROW_COLOURS[platform];

  const syncNow = async () => {
    setSyncing(true);
    try {
      const result = await runSheetSync();
      const changes = result.created + result.updated + result.removed;
      toast.success(
        changes
          ? `Synced: ${result.created} new, ${result.updated} updated, ${result.removed} removed`
          : 'Already up to date'
      );
    } catch (err) {
      toast.error(errorMessage(err, 'Couldn’t read the order sheet. Please try again.'));
    } finally {
      setSyncing(false);
      refresh();
    }
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <FileSpreadsheet className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Order sheet</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span
                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                style={{ backgroundColor: colour.swatch }}
              />
              {colour.label} rows in the LUNAA Order form come in as {NAMES[platform]} orders
              every 15 minutes.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders?source=${platform}`}>View orders</Link>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={syncNow} disabled={syncing || sync?.running}>
            <RefreshCw className={cn('h-3.5 w-3.5', (syncing || sync?.running) && 'animate-spin')} />
            {syncing || sync?.running ? 'Syncing…' : 'Sync now'}
          </Button>
        </div>
      </div>
      <dl className="mt-4 divide-y border-t text-sm">
        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError || !sync ? (
          <p className="px-5 py-4 text-red-600">Couldn’t load the sync status.</p>
        ) : (
          <>
            <div className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="text-muted-foreground">Orders imported</dt>
              <dd className="tabular-nums">{sync.counts[platform].toLocaleString()}</dd>
            </div>
            <div className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="text-muted-foreground">Last synced</dt>
              <dd>
                {sync.lastError ? (
                  <span className="text-red-600">Failed: {sync.lastError.message}</span>
                ) : sync.lastResult ? (
                  formatFriendlyDateTime(sync.lastResult.finishedAt)
                ) : (
                  'Waiting for the first sync'
                )}
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="text-muted-foreground">Tabs read</dt>
              <dd>{sync.tabs.join(', ')}</dd>
            </div>
          </>
        )}
      </dl>
      <UnreadRows platform={platform} issues={sync?.issues ?? []} />
    </Card>
  );
}

function UnreadRows({
  platform,
  issues,
}: {
  platform: Marketplace;
  issues: { tab: string; row_number: number; platform: string | null; buyer_name: string | null; reason: string }[];
}) {
  const rows = issues.filter((issue) => issue.platform === platform);
  if (!rows.length) return null;
  return (
    <div className="border-t">
      <div className="px-5 pt-4">
        <h3 className="text-sm font-semibold">Couldn’t read {rows.length} {rows.length === 1 ? 'row' : 'rows'}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Fix these on the order sheet and the next sync will pick them up.
        </p>
      </div>
      <ul className="mt-2 divide-y text-sm">
        {rows.map((issue) => (
          <li key={`${issue.tab}-${issue.row_number}`} className="flex items-start justify-between gap-4 px-5 py-3">
            <span>
              <span className="font-medium">{issue.buyer_name || 'No name'}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{issue.reason}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {issue.tab} · row {issue.row_number}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShopRow({
  shop,
  onChanged,
}: {
  shop: MarketplaceConnection;
  onChanged: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const { orders } = await syncMarketplaceShop(shop.platform, shop.shopId);
      toast.success(orders ? `Pulled ${orders} updated ${orders === 1 ? 'order' : 'orders'}` : 'Already up to date');
    } catch (err) {
      toast.error(errorMessage(err, 'Couldn’t sync the shop. Please try again.'));
    } finally {
      setSyncing(false);
      onChanged();
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectMarketplaceShop(shop.platform, shop.shopId);
      toast.success('Shop disconnected');
      setConfirming(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Couldn’t disconnect the shop.'));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Store className="h-4 w-4 text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{shop.shopName || `Shop ${shop.shopId}`}</p>
            <p className="text-xs text-muted-foreground">
              Shop ID <span className="font-mono">{shop.shopId}</span>
              {' · '}
              {shop.lastSyncedAt
                ? `Synced ${formatFriendlyDateTime(shop.lastSyncedAt)}`
                : 'First sync in progress'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={sync} disabled={syncing}>
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-red-600"
            onClick={() => setConfirming(true)}
          >
            <Unplug className="h-3.5 w-3.5" />
            Disconnect
          </Button>
        </div>
      </div>
      {shop.lastSyncError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          Last sync failed: {shop.lastSyncError}
        </p>
      )}
      <DeleteDialog
        open={confirming}
        setOpen={setConfirming}
        isLoading={disconnecting}
        onConfirm={disconnect}
        title="Disconnect this shop?"
        description="New orders stop coming in. Orders already pulled stay in the back office, and you can sign in again any time."
        confirmLabel="Disconnect"
      />
    </div>
  );
}

function OrdersCard({ platform }: { platform: Marketplace }) {
  const [page, setPage] = useState(0);
  const { orders, total, isLoading, isError, refresh } = useMarketplaceOrders(platform, page, PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <ShoppingBag className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Orders</h2>
            <p className="text-sm text-muted-foreground">
              {total ? `${total} pulled from ${NAMES[platform]}` : `Pulled from ${NAMES[platform]} every 30 minutes`}
            </p>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-2 border-t px-6 py-12 text-center">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm">Couldn’t load orders</p>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2 border-t p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !orders.length ? (
        <p className="border-t px-6 py-12 text-center text-sm text-muted-foreground">
          No orders yet. They appear here after the first sync.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 font-medium">Buyer</th>
                  <th className="px-3 py-2.5 font-medium">Items</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => {
                  const items = order.items.map((item) =>
                    `${item.name}${item.variation ? ` (${item.variation})` : ''} × ${item.quantity}`
                  );
                  return (
                    <tr key={order.id} className="align-top">
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs">{order.order_number}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatFriendlyDateTime(order.ordered_at)}
                        </p>
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3">{order.buyer_name || '—'}</td>
                      <td className="max-w-[280px] px-3 py-3" title={items.join('\n')}>
                        <p className="truncate">{items[0] ?? '—'}</p>
                        {items.length > 1 && (
                          <p className="text-xs text-muted-foreground">+{items.length - 1} more</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                            statusStyle(order.status)
                          )}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatCurrency(Number(order.total_amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {pages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export function MarketplaceIntegrationPage({ platform }: { platform: Marketplace }) {
  const integration = getIntegration(platform);
  const status = useIntegrationStatus(platform);
  const { status: data, isLoading, isError, refresh } = useMarketplaces();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (!connected && !error) return;
    if (connected) toast.success(`${NAMES[platform]} shop connected. Pulling the last 30 days of orders…`);
    if (error) toast.error(error);
    router.replace(`/integrations/${platform}`);
    refresh();
  }, [searchParams, platform, router, refresh]);

  const shops = data?.connections.filter((c) => c.platform === platform) ?? [];
  const configured = data?.platforms[platform]?.configured ?? false;
  const ready = !!data && configured && !data.setupRequired;

  const connect = () => {
    setRedirecting(true);
    window.location.href = marketplaceConnectUrl(platform);
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
                <IntegrationStatusBadge status={status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          {integration.portalUrl && (
            <Button variant="outline" asChild className="shrink-0 gap-1.5">
              <a href={integration.portalUrl} target="_blank" rel="noreferrer">
                Seller Centre
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        {isError ? (
          <Card className="items-center gap-2 px-6 py-16 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium">Couldn’t load {NAMES[platform]} details</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
              Try again
            </Button>
          </Card>
        ) : isLoading || !data ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <>
            <SheetSyncCard platform={platform} />

            {data.setupRequired && (
              <SetupNotice title="Database setup needed">
                The tables that store connected shops and their orders haven’t been created yet.
              </SetupNotice>
            )}

            <Card className="gap-0 py-0">
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Store className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">
                      Direct connection{' '}
                      <span className="font-normal text-muted-foreground">· optional</span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {configured
                        ? `Sign in with the ${NAMES[platform]} seller account to pull orders straight from ${NAMES[platform]}.`
                        : `Pulls orders straight from ${NAMES[platform]} instead of the sheet. Needs a ${NAMES[platform]} Open Platform app, so it’s off for now.`}
                    </p>
                  </div>
                </div>
                <Button onClick={connect} disabled={!ready || redirecting} className="gap-1.5">
                  {redirecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  {shops.length ? 'Connect another shop' : `Sign in with ${NAMES[platform]}`}
                </Button>
              </div>
              {shops.length > 0 && (
                <div className="divide-y border-t">
                  {shops.map((shop) => (
                    <ShopRow key={shop.shopId} shop={shop} onChanged={() => refresh()} />
                  ))}
                </div>
              )}
            </Card>

            {shops.length > 0 && <OrdersCard platform={platform} />}
          </>
        )}
      </div>
    </div>
  );
}
