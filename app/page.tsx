import type { Metadata } from 'next';
import { BrandedAuthLayout } from '@/components/auth/BrandedAuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Lunaa Women Care · Back Office',
  robots: { index: false, follow: false },
};

export default function BackOfficeHome() {
  return (
    <BrandedAuthLayout>
      <LoginForm />
    </BrandedAuthLayout>
  );
}
