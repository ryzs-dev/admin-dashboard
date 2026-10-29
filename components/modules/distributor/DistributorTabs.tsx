import { cn } from '@/lib/utils';

export type DistributorView = 'orders' | 'list';

const VIEWS: { value: DistributorView; label: string }[] = [
  { value: 'orders', label: 'Orders' },
  { value: 'list', label: 'Distributor list' },
];

export function DistributorTabs({
  value,
  onChange,
}: {
  value: DistributorView;
  onChange: (view: DistributorView) => void;
}) {
  return (
    <div className="flex gap-1 border-b">
      {VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          onClick={() => onChange(view.value)}
          className={cn(
            '-mb-px border-b-2 px-3 pb-3 text-sm font-medium transition-colors',
            value === view.value
              ? 'border-[#662d91] text-[#662d91]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
