'use client';

import { useState } from 'react';
import ConfirmDeleteDialog from '../../alert/DeleteDialog';

type DeleteDialogProps = {
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  children: (props: { open: () => void }) => React.ReactNode;
};

export function DeleteDialog({
  title = 'Delete item?',
  description = 'This can’t be undone.',
  onConfirm,
  children,
}: DeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children({ open: () => setOpen(true) })}
      <ConfirmDeleteDialog
        open={open}
        setOpen={setOpen}
        isLoading={loading}
        onConfirm={handleConfirm}
        title={title}
        description={description}
      />
    </>
  );
}
