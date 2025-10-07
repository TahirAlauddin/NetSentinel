import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logout - NetSentinel",
  description: "Signing out of NetSentinel Network Operations Dashboard",
};

export default function LogoutLayout({
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
