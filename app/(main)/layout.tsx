import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import CRMLayout from '@/components/layout/CRMLayout';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/providers/auth-providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lunaa Women Care · Back Office',
  description: 'Lunaa Women Care back office for orders, customers and shipping.',
  keywords: [
    'CRM',
    'Customer Management',
    'WhatsApp Integration',
    'Analytics',
    'LUNAA',
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <main
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CRMLayout>{children}</CRMLayout>
        <Toaster />
      </main>
    </AuthProvider>
  );
}
