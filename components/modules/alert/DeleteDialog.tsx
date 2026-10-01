import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type DeleteDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export default function DeleteDialog({
  open,
  setOpen,
  isLoading = false,
  onConfirm,
  title = 'Delete item?',
  description = 'This can’t be undone.',
  confirmLabel = 'Delete',
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isLoading && setOpen(next)}>
      <AlertDialogContent className="sm:max-w-md">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="space-y-1.5 pt-0.5">
            <AlertDialogTitle className="text-base font-semibold">{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={() => onConfirm()}
            className="min-w-24"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
