// app/layout.tsx - Updated Root Layout
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CRMLayout from "@/components/layout/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUNAA CRM - Customer Relationship Management",
  description: "Advanced CRM system for LUNAA with WhatsApp integration, customer management, and analytics",
  keywords: ["CRM", "Customer Management", "WhatsApp Integration", "Analytics", "LUNAA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CRMLayout>
          {children}
        </CRMLayout>
      </body>
    </html>
  );
}