import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Package,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'LUNAA CRM · Back Office',
  robots: { index: false, follow: false },
};

const MODULES = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Revenue, repeat customers and product performance',
  },
  {
    icon: ShoppingBag,
    title: 'Orders',
    description: 'Create, filter and manage every order',
  },
  {
    icon: Truck,
    title: 'Shipping',
    description: 'Parcel Daily shipments and live tracking',
  },
  {
    icon: Users,
    title: 'Customers',
    description: 'Purchase history and repeat buyers',
  },
  {
    icon: MessageSquare,
    title: 'Inbox',
    description: 'WhatsApp conversations and broadcasts',
  },
  {
    icon: Package,
    title: 'Products',
    description: 'Catalogue, pricing and stock codes',
  },
];

function Logo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white ${className}`}
    >
      L
    </div>
  );
}

export default function BackOfficeHome() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col justify-between px-8 py-10 sm:px-14 lg:px-20">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 text-sm" />
          <div className="leading-tight">
            <p className="font-bold tracking-tight">LUNAA CRM</p>
            <p className="text-xs text-muted-foreground">Back Office</p>
          </div>
        </div>

        <div className="max-w-md py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            <Lock className="h-3 w-3" />
            Authorised staff only
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Welcome back.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Orders, customers, shipping and WhatsApp for LUNAA, all in one
            place. Sign in with your staff account to continue.
          </p>
          <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/login">
              Sign in
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Trouble signing in?{' '}
            <Link
              href="/forget-password"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Reset your password
            </Link>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LUNAA. Internal use only.
        </p>
      </section>

      <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:items-center">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />

        <div className="relative w-full px-14 xl:px-20">
          <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
            What&apos;s inside
          </p>
          <div className="mt-6 grid gap-3 xl:grid-cols-2">
            {MODULES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
