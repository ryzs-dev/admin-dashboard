'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/dashboard/Panel';
import { MonthPicker } from '@/components/dashboard/PeriodPickers';
import { ReportSummary } from '@/components/sales-report/ReportSummary';
import { ReportTable } from '@/components/sales-report/ReportTable';
import { todayInMalaysia } from '@/components/ads/period';
import { downloadSalesReport, getSalesReport } from '@/lib/api/sales-report';

export default function SalesReportPage() {
  const today = todayInMalaysia();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [downloading, setDownloading] = useState(false);

  const { data: report, error, isLoading, mutate } = useSWR(['sales-report', month], () => getSalesReport(month), {
    revalidateOnFocus: false,
    keepPreviousData: true,
    refreshInterval: month === today.slice(0, 7) ? 5 * 60_000 : 0,
  });
  const loading = isLoading || !report || report.month !== month;
  const label = format(parseISO(`${month}-01`), 'MMMM yyyy');

  const download = async () => {
    setDownloading(true);
    try {
      await downloadSalesReport(month);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Couldn’t build the Excel file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="pb-2">
          <PageHeader
            title="Sales report"
            description={`Daily sales sheet for ${label}, filled in from orders and Meta ads.`}
          >
            <MonthPicker value={month} max={today.slice(0, 7)} onChange={setMonth} />
            <Button variant="outline" className="gap-1.5" onClick={download} disabled={downloading || loading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Excel
            </Button>
          </PageHeader>
        </div>

        {error ? (
          <Panel className="px-5 py-4 text-sm text-destructive">{error.message}</Panel>
        ) : (
          <>
            {report && !report.ad_account && (
              <Panel className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="text-muted-foreground">
                  Meta ads isn’t connected, so ad spend, messages and ROAS stay empty.
                </span>
                <Link href="/integrations/meta-ads" className="font-medium hover:underline">
                  Connect Meta ads
                </Link>
              </Panel>
            )}
            <ReportSummary
              report={loading ? undefined : report}
              isLoading={loading}
              onSaved={(r) => mutate(r, { revalidate: false })}
            />
            <ReportTable report={loading ? undefined : report} today={today} isLoading={loading} />
            <p className="px-1 text-xs text-muted-foreground">
              Days are Malaysia time, by when the order was created. WhatsApp / FB counts chat orders (not distributor);
              repeat means the customer ordered before. Shopee and Lazada have no customer record, so repeat there means
              the same buyer name ordered before on a marketplace, counted from when the marketplace sync started.
              {report?.ad_account?.name && ` Ad numbers from ${report.ad_account.name}.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
