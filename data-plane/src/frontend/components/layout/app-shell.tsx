"use client"

import type React from "react";
import { useState } from "react";
import { Topbar } from "./topbar";
import { Sidebar } from "./sidebar";
import { SectionalNavigation } from "./sectional-navigation";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={closeMobileMenu} />
      </div>

      <header className="sticky top-0 z-40">
        <Topbar onMenuToggle={toggleMobileMenu} />
        {/* Secondary navbar with sectional bar */}
        <nav
          aria-label="Sectional navigation"
          className="w-full bg-secondary text-secondary-foreground border-b border-border"
        >
          <div className="mx-auto max-w-[1400px] px-4">
            <SectionalNavigation />
          </div>
        </nav>
      </header>

      {/* Main content area */}
      <div className="w-full">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:pl-6">
          <main className="py-4 sm:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
