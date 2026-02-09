import type React from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AuthProvider } from "@/components/auth-provider";
import { ErrorBoundary } from "@/components/feedback/error-boundary";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetSentinel",
  description: "NetSentinel Network Operations Dashboard",
};

/** Force dynamic rendering so CSP nonces from middleware are applied during SSR. */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
