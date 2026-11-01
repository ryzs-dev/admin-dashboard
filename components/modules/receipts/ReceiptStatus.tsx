import { CheckCircle2, CircleAlert, CircleHelp, Clock, Receipt as ReceiptIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReceiptCheckStatus } from '@/types/receipt';

export const RECEIPT_STATUS: Record<
  ReceiptCheckStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  match: { label: 'Receipt matches', className: 'bg-[#dcfae5] text-[#04250e]', icon: CheckCircle2 },
  mismatch: { label: 'Receipt doesn’t match', className: 'bg-[#ffedea] text-[#831c1e]', icon: CircleAlert },
  pending: { label: 'Checking receipt', className: 'bg-gray-100 text-gray-700', icon: Clock },
  unreadable: { label: 'Receipt unreadable', className: 'bg-[#fffbeb] text-[#92400e]', icon: CircleHelp },
  error: { label: 'Receipt check failed', className: 'bg-[#fffbeb] text-[#92400e]', icon: CircleHelp },
  not_checked: { label: 'Receipt saved', className: 'bg-gray-100 text-gray-700', icon: ReceiptIcon },
};

export function ReceiptStatus({
  status,
  className,
}: {
  status: ReceiptCheckStatus;
  className?: string;
}) {
  const s = RECEIPT_STATUS[status];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        'inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        s.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}
