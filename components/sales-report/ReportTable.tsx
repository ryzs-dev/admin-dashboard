import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader } from '@/components/dashboard/Panel';
import { SalesReport, SalesReportRow } from '@/types/sales-report';
import { pct, roasText } from './ReportSummary';

const money = (n: number | null) =>
  n == null || n === 0 ? null : n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const count = (n: number) => (n ? n.toLocaleString() : null);

type Col = {
  key: string;
  label: string;
  title?: string;
  value: (r: SalesReportRow) => string | null;
  tone?: (r: SalesReportRow) => 'good' | 'bad' | null;
  strong?: boolean;
};

// Same columns and formulas as Lunaa's sheet, grouped.
const GROUPS: { label: string; cols: Col[] }[] = [
  {
    label: 'Ads',
    cols: [
      { key: 'ad_spend', label: 'Ad spend (RM)', value: (r) => money(r.ad_spend) },
      { key: 'messages', label: 'Messages', title: 'Chats started from ads', value: (r) => count(r.messages) },
      { key: 'ad_comments', label: 'Comments', title: 'Comments left on the ads', value: (r) => count(r.ad_comments) },
      { key: 'cpm', label: 'Cost / msg', value: (r) => money(r.cost_per_message) },
    ],
  },
  {
    label: 'WhatsApp / FB',
    cols: [
      { key: 'wa_orders', label: 'Orders', value: (r) => count(r.wa_orders) },
      { key: 'wa_new', label: 'New', value: (r) => count(r.wa_new) },
      { key: 'wa_repeat', label: 'Repeat', value: (r) => count(r.wa_repeat) },
      { key: 'repeat_pct', label: 'Repeat %', value: (r) => (r.repeat_pct == null ? null : pct(r.repeat_pct)) },
      {
        key: 'cpc',
        label: 'Cost / conv.',
        title: 'Ad spend ÷ new WhatsApp orders',
        value: (r) => money(r.cost_per_conversion),
      },
      {
        key: 'conv',
        label: 'Conv. rate',
        title: 'New WhatsApp orders ÷ messages',
        value: (r) => (r.conversion_rate == null ? null : pct(r.conversion_rate)),
      },
    ],
  },
  {
    label: 'Shopee / LZD',
    cols: [
      { key: 'shopee', label: 'Shopee', value: (r) => count(r.shopee_orders) },
      { key: 'lazada', label: 'LZD', value: (r) => count(r.lazada_orders) },
      { key: 'mp_new', label: 'New', value: (r) => count(r.mp_new) },
      { key: 'mp_repeat', label: 'Repeat', value: (r) => count(r.mp_repeat) },
    ],
  },
  {
    label: 'All channels',
    cols: [
      { key: 'orders', label: 'Total orders', value: (r) => count(r.orders), strong: true },
      { key: 'sales', label: 'Sales (RM)', value: (r) => money(r.sales), strong: true },
      {
        key: 'roas',
        label: 'ROAS',
        title: 'Sales ÷ ad spend. Green at 2 or more.',
        value: (r) => (r.roas == null ? null : roasText(r.roas)),
        tone: (r) => (r.roas == null ? null : r.roas >= 2 ? 'good' : 'bad'),
      },
      { key: 'aov', label: 'AOV', value: (r) => money(r.aov) },
    ],
  },
];
const COLS = GROUPS.flatMap((g) => g.cols);
const FIRST = new Set(GROUPS.map((g) => g.cols[0].key));

const HEAD = 'sticky z-10 whitespace-nowrap bg-card px-3 text-xs font-medium text-muted-foreground';
const FOOT = 'sticky bottom-0 z-10 bg-card shadow-[inset_0_1px_0_var(--border)]';
const TD = 'px-3 py-2 text-right tabular-nums whitespace-nowrap';
const dash = <span className="text-muted-foreground/50">—</span>;

function Cells({ row, foot }: { row: SalesReportRow; foot?: boolean }) {
  return (
    <>
      {COLS.map((c) => {
        const v = c.value(row);
        const tone = c.tone?.(row);
        return (
          <td
            key={c.key}
            className={cn(
              TD,
              foot && FOOT,
              FIRST.has(c.key) && 'border-l border-border/60',
              c.strong && 'font-medium',
              tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
              tone === 'bad' && 'text-red-600 dark:text-red-400'
            )}
          >
            {v ?? dash}
          </td>
        );
      })}
    </>
  );
}

export function ReportTable({
  report,
  today,
  isLoading,
}: {
  report?: SalesReport;
  today: string;
  isLoading?: boolean;
}) {
  const days = report?.days ?? [];

  return (
    <Panel>
      <PanelHeader title="Day by day" meta="Malaysia time" />
      <div className="px-2 pb-2 pt-1">
        <div className="relative max-h-[640px] overflow-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr>
                <th rowSpan={2} className={cn(HEAD, 'left-0 top-0 z-20 py-2 text-left align-bottom shadow-[inset_0_-1px_0_var(--border)]')}>
                  Date
                </th>
                {GROUPS.map((g) => (
                  <th
                    key={g.label}
                    colSpan={g.cols.length}
                    className={cn(HEAD, 'top-0 h-7 border-l border-border/60 text-center font-semibold text-foreground')}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    title={c.title}
                    className={cn(
                      HEAD,
                      'top-7 py-2 text-right shadow-[inset_0_-1px_0_var(--border)]',
                      FIRST.has(c.key) && 'border-l border-border/60'
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={COLS.length + 1} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : days.map((d) => (
                    <tr key={d.date} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="sticky left-0 z-[5] whitespace-nowrap bg-card px-3 py-2 font-medium">
                        {format(parseISO(d.date), 'EEE d MMM')}
                        {d.date === today && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Today
                          </span>
                        )}
                      </td>
                      <Cells row={d} />
                    </tr>
                  ))}
            </tbody>
            {!isLoading && report && days.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td className={cn(FOOT, 'left-0 z-20 px-3 py-2')}>Total</td>
                  <Cells row={report.totals} foot />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Panel>
  );
}
