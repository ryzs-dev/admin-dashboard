'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  KeyRound,
  MapPin,
  Pencil,
  Settings2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatCard } from '@/components/layout/StatCard';
import {
  IntegrationLogo,
  IntegrationStatusBadge,
  useIntegrationStatus,
} from '@/components/modules/integrations/IntegrationBits';
import { getIntegration } from '@/components/modules/integrations/registry';
import { PickupAddressDialog } from '@/components/modules/integrations/parcel-daily/PickupAddressDialog';
import { ShippingDefaultsDialog } from '@/components/modules/integrations/parcel-daily/ShippingDefaultsDialog';
import { CourierLogo } from '@/components/modules/parcel-daily/CourierPicker';
import { courierInfo } from '@/components/modules/parcel-daily/couriers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useParcelDailyAccount, useParcelDailySettings } from '@/hooks/useParcelDaily';
import { ParcelDailySettings } from '@/lib/api/parcel-daily';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDateTime } from '@/lib/utils/date';
import { formatPhone } from '@/lib/utils/phone';

const integration = getIntegration('parcel-daily');
const LOW_CREDIT_RM = 50;

function SettingsCard({
  icon: Icon,
  title,
  description,
  onEdit,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {onEdit && (
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
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

export default function ParcelDailyIntegrationPage() {
  const status = useIntegrationStatus('parcel-daily');
  const { account, isLoading: accountLoading, isError: accountError } = useParcelDailyAccount();
  const { settings, isError, refresh } = useParcelDailySettings();
  const [editing, setEditing] = useState<'address' | 'defaults' | null>(null);

  const handleSaved = (message: string) => (next: ParcelDailySettings) => {
    refresh({ ...next, connection: settings?.connection }, { revalidate: false });
    toast.success(message);
  };

  const credit = Number(account?.credit ?? 0);
  const lowCredit = !!account && credit < LOW_CREDIT_RM;
  const address = settings?.pickupAddress;
  const defaults = settings?.defaults;
  const defaultCourier = defaults ? courierInfo(defaults.courier) : undefined;

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
                Open Parcel Daily
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Credit balance"
            icon={Wallet}
            isLoading={accountLoading}
            value={accountError ? '—' : formatCurrency(credit)}
            hint={
              accountError ? (
                'Couldn’t reach Parcel Daily'
              ) : (
                <a
                  href={integration.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Top up credit
                </a>
              )
            }
            className={lowCredit ? 'border-amber-300 bg-amber-50/60' : undefined}
          />
          <StatCard
            label="Top-up package"
            icon={CalendarClock}
            isLoading={accountLoading}
            value={<span className="capitalize">{account?.topupPackage ?? '—'}</span>}
            hint={account ? `${account.expiresIn} of ${account.packageValidDays} days left` : undefined}
          />
        </div>

        {lowCredit && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Credit is below {formatCurrency(LOW_CREDIT_RM)}. Shipments fail to book once it runs
              out, so top up in Parcel Daily soon.
            </p>
          </div>
        )}

        {isError ? (
          <Card className="items-center gap-2 px-6 py-16 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium">Couldn’t load Parcel Daily settings</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
              Try again
            </Button>
          </Card>
        ) : !settings || !address || !defaults ? (
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <SettingsCard
              icon={MapPin}
              title="Pickup address"
              description="Where couriers collect parcels. Printed as the sender on every label."
              onEdit={() => setEditing('address')}
            >
              <Row label="Sender">{address.fullName}</Row>
              <Row label="Phone">
                <span className="tabular-nums">{formatPhone(`60${address.phone}`)}</span>
              </Row>
              {address.email && <Row label="Email">{address.email}</Row>}
              <Row label="Address">
                <span className="block">{[address.line1, address.line2].filter(Boolean).join(', ')}</span>
                <span className="block text-muted-foreground">
                  {address.postcode} {address.city}, {address.state}
                </span>
              </Row>
            </SettingsCard>

            <SettingsCard
              icon={Settings2}
              title="Shipping defaults"
              description="Pre-filled on every new shipment."
              onEdit={() => setEditing('defaults')}
            >
              <Row label="Default courier">
                {defaultCourier && (
                  <span className="flex items-center gap-2.5">
                    <CourierLogo courier={defaultCourier} className="h-7 w-12" />
                    {defaultCourier.label}
                  </span>
                )}
              </Row>
              <Row label="Handover">{defaults.isDropoff ? 'Drop-off at a counter' : 'Courier pickup'}</Row>
              <Row label="Parcel weight">
                <span className="tabular-nums">{defaults.kg} kg</span>
              </Row>
            </SettingsCard>

            {settings.connection && (
              <SettingsCard
                icon={KeyRound}
                title="Connection"
                description="API credentials are set on the server and managed in Parcel Daily."
              >
                <Row label="Account">
                  {settings.connection.environment === 'live' ? 'Live' : 'Sandbox (test)'}
                </Row>
                <Row label="Merchant ID">
                  <span className="font-mono text-xs">{settings.connection.merchantId}</span>
                </Row>
                {settings.updatedAt && (
                  <Row label="Settings updated">{formatFriendlyDateTime(settings.updatedAt)}</Row>
                )}
              </SettingsCard>
            )}

            <PickupAddressDialog
              open={editing === 'address'}
              onOpenChange={(open) => setEditing(open ? 'address' : null)}
              settings={settings}
              onSaved={handleSaved('Pickup address saved')}
            />
            <ShippingDefaultsDialog
              open={editing === 'defaults'}
              onOpenChange={(open) => setEditing(open ? 'defaults' : null)}
              settings={settings}
              onSaved={handleSaved('Shipping defaults saved')}
            />
          </>
        )}
      </div>
    </div>
  );
}
