'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  error?: string | null;
  footerNote?: React.ReactNode;
  size?: keyof typeof SIZES;
  trigger?: React.ReactNode;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel,
  submittingLabel = 'Saving…',
  isSubmitting = false,
  submitDisabled = false,
  error,
  footerNote,
  size = 'md',
  trigger,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0',
          SIZES[size]
        )}
        onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting && !submitDisabled) onSubmit();
          }}
        >
          <div className="border-b px-6 py-5 pr-12">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className={cn('mt-1', !description && 'sr-only')}>
              {description ?? title}
            </DialogDescription>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {children}
            {error && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 truncate text-sm text-muted-foreground">
              {footerNote}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || submitDisabled}
                className="min-w-28"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {submittingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FormSection({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function errorMessage(err: unknown, fallback: string): string {
  const data = (
    err as {
      response?: {
        data?: {
          message?: string;
          error?: string;
          details?: string | { message?: string; error?: string; details?: { message?: string } };
        };
      };
    }
  )?.response?.data;
  const details = data?.details;
  if (typeof details === 'string') return details;
  return (
    details?.details?.message ||
    details?.message ||
    details?.error ||
    data?.message ||
    data?.error ||
    (err instanceof Error && err.message) ||
    fallback
  );
}
