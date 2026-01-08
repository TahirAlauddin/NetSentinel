"use client";

import { Menu, X } from "lucide-react";
import { SECTIONS } from "@/components/apps/assets/constants/asset-detail";

interface AssetDetailSidebarProps {
  activeSection: string;
  mobileSidebarOpen: boolean;
  onSectionClick: (id: string) => void;
  onMobileSidebarToggle: () => void;
  onMobileSidebarClose: () => void;
}

export function AssetDetailSidebar({
  activeSection,
  mobileSidebarOpen,
  onSectionClick,
  onMobileSidebarToggle,
  onMobileSidebarClose,
}: AssetDetailSidebarProps) {
  return (
    <>
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
        onClick={onMobileSidebarToggle}
      >
        {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Left Sidebar Navigation */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full z-20
          w-64 md:w-52 bg-white border-r p-4 shrink-0
          transform transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          overflow-y-auto
        `}
      >
        <div className="p-4 sticky top-0 bg-white">
          <div className="md:hidden flex justify-between items-center mb-4 pb-4 border-b">
            <span className="font-semibold">Navigation</span>
            <button onClick={onMobileSidebarClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <section.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onMobileSidebarClose} />
      )}
    </>
  );
}
