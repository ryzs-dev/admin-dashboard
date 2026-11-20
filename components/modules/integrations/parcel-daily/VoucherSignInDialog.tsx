'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/forms/Field';
import { errorMessage, FormDialog } from '@/components/forms/FormDialog';
import { Input } from '@/components/ui/input';
import { useParcelDailyVouchers } from '@/hooks/useParcelDaily';
import { signInParcelDaily } from '@/lib/api/parcel-daily';

// Signs the CRM in to the Parcel Daily website so bookings can use vouchers.
// The password goes straight to Parcel Daily and is not stored.
export function VoucherSignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { session, refresh } = useParcelDailyVouchers();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLogin(session?.account ?? '');
    setPassword('');
    setError(null);
  }, [open, session?.account]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await signInParcelDaily(login, password);
      await refresh();
      toast.success('Vouchers on');
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t sign in to Parcel Daily'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign in to Parcel Daily"
      description="Vouchers come off each shipment automatically."
      onSubmit={handleSubmit}
      submitLabel="Sign in"
      submittingLabel="Signing in…"
      isSubmitting={saving}
      submitDisabled={!login.trim() || !password}
      error={error}
      size="sm"
    >
      <Field label="Email or phone" htmlFor="pd-login">
        <Input
          id="pd-login"
          autoComplete="username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          disabled={saving}
          autoFocus
        />
      </Field>
      <Field label="Password" htmlFor="pd-password" hint="Not saved in the CRM.">
        <Input
          id="pd-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}
