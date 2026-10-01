import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ElementType;
  isLoading?: boolean;
  className?: string;
};

export function StatCard({ label, value, hint, icon: Icon, isLoading, className }: StatCardProps) {
  return (
    <Card className={cn('h-full w-full gap-0 py-0', className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="my-1 h-6 w-24" />
          ) : (
            <p className="truncate text-2xl font-semibold tabular-nums">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{hint ?? '\u00A0'}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
      </CardContent>
    </Card>
  );
}
