import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - NetSentinel",
  description: "Sign in to NetSentinel Network Operations Dashboard",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}