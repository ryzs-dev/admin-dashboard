'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { IntegrationLogo } from '@/components/modules/integrations/IntegrationBits';
import { getIntegration } from '@/components/modules/integrations/registry';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { completeConverraConnect, converraErrorMessage } from '@/lib/api/converra';
import { announceConverraConnect } from '@/lib/converra-connect-events';

const integration = getIntegration('converra');

const PROVIDER_ERRORS: Record<string, string> = {
  access_denied: 'The connection was cancelled in Converra.',
};

function ConverraCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // The code is single-use: don't send it twice (React Strict Mode runs effects twice in dev).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const providerError = params.get('error');
    const code = params.get('code');
    const state = params.get('state');

    if (providerError) {
      const message = PROVIDER_ERRORS[providerError] ?? `Converra couldn’t connect: ${providerError}`;
      announceConverraConnect({ type: 'failed', message });
      setError(message);
      return;
    }
    if (!code || !state) {
      setError('This link is missing the approval code. Start the connection again.');
      return;
    }

    completeConverraConnect({ code, state })
      .then((status) => {
        announceConverraConnect({ type: 'connected', workspaceName: status.workspaceName });
        // Opened from the Integrations page: that tab refreshes itself, so close this one.
        window.close();
        void mutate('converra-status', status, { revalidate: false });
        void mutate('converra-sync-runs');
        toast.success(
          status.workspaceName
            ? `Connected to ${status.workspaceName} — syncing customers now`
            : 'Converra connected — syncing customers now'
        );
        router.replace('/integrations/converra');
      })
      .catch((err) => {
        const message = converraErrorMessage(err, 'Couldn’t finish connecting to Converra.');
        announceConverraConnect({ type: 'failed', message });
        setError(message);
      });
  }, [params, router]);

  return (
    <Card className="items-center gap-3 px-6 py-14 text-center">
      <IntegrationLogo integration={integration} size={48} />
      {error ? (
        <>
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4" />
            Converra wasn’t connected
          </div>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" asChild className="mt-2 gap-1.5">
            <Link href="/integrations/converra">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Converra
            </Link>
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to Converra…
          </div>
          <p className="text-sm text-muted-foreground">
            Saving the connection and starting the first customer sync.
          </p>
        </>
      )}
    </Card>
  );
}

export default function ConverraCallbackPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-xl pt-10">
        <Suspense
          fallback={
            <Card className="items-center gap-3 px-6 py-14 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </Card>
          }
        >
          <ConverraCallback />
        </Suspense>
      </div>
    </div>
  );
}
