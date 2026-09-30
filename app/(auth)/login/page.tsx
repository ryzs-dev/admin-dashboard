import type { Metadata } from 'next';
import { BrandedAuthLayout } from '@/components/auth/BrandedAuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in · Lunaa Women Care',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <BrandedAuthLayout>
      <LoginForm />
    </BrandedAuthLayout>
  );
}
