import { cn } from '@/lib/utils';

// Flat dashboard surface: one 1px edge, no shadow, 8px corners.
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-lg border bg-card', className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-4">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

export function Change({
  value,
  goodWhen = 'up',
  suffix = '%',
}: {
  value: number | null;
  goodWhen?: 'up' | 'down';
  suffix?: string;
}) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return <span className="tabular-nums text-muted-foreground">0.0{suffix}</span>;
  }

  const up = rounded > 0;
  const good = goodWhen === 'up' ? up : !up;

  return (
    <span
      className={cn(
        'whitespace-nowrap tabular-nums font-medium',
        good ? 'text-[#247b50]' : 'text-[#c4242a]'
      )}
    >
      <span aria-hidden>{up ? '▲' : '▼'}</span>{' '}
      {up ? '+' : '−'}
      {Math.abs(rounded).toFixed(1)}
      {suffix}
    </span>
  );
}
