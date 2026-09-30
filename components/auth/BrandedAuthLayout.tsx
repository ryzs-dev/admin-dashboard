import Image from 'next/image';
import { ReactNode } from 'react';

export function BrandedAuthLayout({ children }: { children: ReactNode }) {
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

      <main className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <Image
              src="/brand/lunaa-logo.png"
              alt="LUNAA – Soft & Strong"
              width={1188}
              height={437}
              priority
              className="mx-auto h-auto w-44"
            />
            <div className="mx-auto my-7 h-px w-12 bg-[#662d91]/30" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Lunaa Women Care
            </h1>
            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#662d91]">
              Back Office
            </p>
          </div>

          {children}
        </div>
      </main>

      <footer className="relative pb-8 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} LUNAA &amp; SIX SDN BHD · Internal use
        only
      </footer>
    </div>
  );
}
