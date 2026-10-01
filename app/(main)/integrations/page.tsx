'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import {
  IntegrationLogo,
  IntegrationStatusBadge,
  useIntegrationStatus,
} from '@/components/modules/integrations/IntegrationBits';
import { Integration, INTEGRATIONS } from '@/components/modules/integrations/registry';

function IntegrationCard({ integration }: { integration: Integration }) {
  const status = useIntegrationStatus(integration.id);
  return (
    <Link href={integration.href} className="group block h-full">
      <Card className="h-full gap-0 py-0 transition-colors group-hover:border-gray-300 group-hover:shadow-sm">
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <IntegrationLogo integration={integration} size={44} />
          <IntegrationStatusBadge status={status} />
        </div>
        <div className="flex-1 px-5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-semibold">{integration.name}</h2>
            <span className="text-xs text-muted-foreground">{integration.category}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t px-5 py-3 text-sm font-medium text-primary">
          Manage
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Integrations"
          description="Services connected to the back office, and how each one is set up."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center">
            <div className="rounded-lg bg-gray-100 p-2">
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <p className="text-sm font-medium">More integrations coming</p>
            <p className="text-xs text-muted-foreground">They’ll appear here as they’re added.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
