import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Lunaa Women Care · Back Office',
  robots: { index: false, follow: false },
};

export default function BackOfficeHome() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fff8f3] text-[#232323]">
      <Image
        src="/brand/lunaa-icon.png"
        alt=""
        width={300}
        height={300}
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] opacity-[0.06] select-none"
      />

      <main className="relative flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <Image
            src="/brand/lunaa-logo.png"
            alt="LUNAA – Soft & Strong"
            width={1188}
            height={437}
            priority
            className="mx-auto h-auto w-48"
          />

          <div className="mx-auto my-8 h-px w-12 bg-[#662d91]/30" />

          <h1 className="text-2xl font-semibold tracking-tight">
            Lunaa Women Care
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#662d91]">
            Back Office
          </p>
          <p className="mt-6 text-sm leading-relaxed text-neutral-600">
            Orders, customers, shipping and WhatsApp.
            <br />
            For LUNAA staff only.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#662d91] text-sm font-medium text-white transition-colors hover:bg-[#55247a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#662d91] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8f3]"
          >
            Sign in
          </Link>
          <Link
            href="/forget-password"
            className="mt-4 inline-block text-sm text-neutral-500 hover:text-[#662d91]"
          >
            Forgot your password?
          </Link>
        </div>
      </main>

      <footer className="relative pb-8 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} LUNAA &amp; SIX SDN BHD · Internal use
        only
      </footer>
    </div>
  );
}
