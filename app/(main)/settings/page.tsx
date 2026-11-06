'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bot, Phone, Receipt, Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AutopilotSettings } from '@/components/modules/autopilot/AutopilotSettings';
import { SaveState } from '@/components/modules/autopilot/AutopilotSwitch';
import { ReceiptSettingsSection } from '@/components/modules/receipts/ReceiptSettings';
import { ShippingSettings } from '@/components/modules/settings/ShippingSettings';
import { StaffPhonesSettings } from '@/components/modules/settings/StaffPhonesSettings';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    id: 'autopilot',
    label: 'Autopilot',
    icon: Bot,
    description: 'Ships new orders and sends tracking numbers every day.',
  },
  {
    id: 'shipping',
    label: 'Shipping',
    icon: Truck,
    description: 'Which couriers carry your parcels, including cash-on-delivery orders.',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    icon: Receipt,
    description: 'Payment receipts staff send on WhatsApp with each order.',
  },
  {
    id: 'staff',
    label: 'Staff numbers',
    icon: Phone,
    description: 'The staff WhatsApp numbers the bot takes orders from.',
  },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
type Save = 'idle' | 'saving' | 'saved';

function SettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('section');
  const section: SectionId = SECTIONS.some((s) => s.id === requested)
    ? (requested as SectionId)
    : 'autopilot';
  const current = SECTIONS.find((s) => s.id === section)!;
  const [saveState, setSaveState] = useState<Save>('idle');

  // Meta ads moved to Integrations; old links still land in the right place.
  useEffect(() => {
    if (requested === 'ads') router.replace('/integrations/meta-ads');
  }, [requested, router]);

  const go = (id: SectionId) => router.replace(`${pathname}?section=${id}`, { scroll: false });

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Settings" description="How the back office runs. Changes save as you make them.">
          <SaveState state={saveState} />
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Section menu: a list on desktop, a dropdown on a phone. */}
          <nav aria-label="Settings sections" className="hidden lg:block">
            <ul className="space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={section === s.id ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      section === s.id
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="lg:hidden">
            <Select value={section} onValueChange={(value) => go(value as SectionId)}>
              <SelectTrigger aria-label="Settings section" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <section aria-labelledby="settings-section-title" className="min-w-0 space-y-4">
            <div>
              <h2 id="settings-section-title" className="text-base font-semibold">
                {current.label}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{current.description}</p>
            </div>

            {section === 'autopilot' && <AutopilotSettings onSaving={setSaveState} />}
            {section === 'shipping' && <ShippingSettings onSaving={setSaveState} />}
            {section === 'receipts' && <ReceiptSettingsSection onSaving={setSaveState} />}
            {section === 'staff' && <StaffPhonesSettings onSaving={setSaveState} />}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
