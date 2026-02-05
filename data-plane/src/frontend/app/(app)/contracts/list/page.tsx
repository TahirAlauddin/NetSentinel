"use client";

import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

const contracts = [
  {
    id: 1,
    name: "Design/Prototyping",
    category: "Product and Design",
    totalCost: "$9,600.00",
    icon: "🎨",
    color: "bg-yellow-400",
  },
  {
    id: 2,
    name: "Gnsto HR",
    category: "HR",
    totalCost: "$30,600.00",
    icon: "G",
    color: "bg-orange-500",
  },
  {
    id: 3,
    name: "DIA Fiber HQ",
    category: "Telecom",
    totalCost: "$46,080.00",
    icon: "📡",
    color: "bg-orange-600",
  },
  {
    id: 4,
    name: "Rise Digital Ads",
    category: "Advertising",
    totalCost: "$39,984.00",
    icon: "R",
    color: "bg-gray-800",
  },
  {
    id: 5,
    name: "Sales Tracking",
    category: "Sales and Business De...",
    totalCost: "$28,800.00",
    icon: "📊",
    color: "bg-gray-700",
  },
  {
    id: 6,
    name: "Agreement Management Software",
    category: "General",
    totalCost: "$82,560.00",
    icon: "📄",
    color: "bg-purple-600",
  },
  {
    id: 7,
    name: "CoPlot",
    category: "Productivity",
    totalCost: "$57,600.00",
    icon: "▣",
    color: "bg-blue-500",
  },
  {
    id: 8,
    name: "Intlect",
    category: "Finance and Accounting",
    totalCost: "$36,000.00",
    icon: "▼",
    color: "bg-black",
  },
  {
    id: 9,
    name: "Azure",
    category: "Cloud",
    totalCost: "$195,254.40",
    icon: "▣",
    color: "bg-blue-500",
  },
  {
    id: 10,
    name: "Internet Circuit",
    category: "Telecom",
    totalCost: "$48,000.00",
    icon: "━",
    color: "bg-gray-600",
  },
  {
    id: 11,
    name: "DIA Data Circuit",
    category: "IT and Security",
    totalCost: "$42,200.00",
    icon: "━",
    color: "bg-gray-600",
  },
  {
    id: 12,
    name: "Teams Phone Service",
    category: "Telecom",
    totalCost: "$22,200.00",
    icon: "▣",
    color: "bg-blue-500",
  },
  {
    id: 13,
    name: "Security Awareness",
    category: "IT and Security",
    totalCost: "$54,000.00",
    icon: "⊚",
    color: "bg-red-600",
  },
  {
    id: 14,
    name: "Atlassian Jira",
    category: "Developer Tools",
    totalCost: "$7,680.00",
    icon: "△",
    color: "bg-blue-600",
  },
  {
    id: 15,
    name: "Chicago Office Rent",
    category: "Facilities",
    totalCost: "$39,000.00",
    icon: "▣",
    color: "bg-blue-700",
  },
  {
    id: 16,
    name: "New York Office",
    category: "Facilities",
    totalCost: "$50,823.36",
    icon: "W",
    color: "bg-gray-600",
  },
  {
    id: 17,
    name: "Zendesk Customer Support",
    category: "Customer Support",
    totalCost: "$32,400.00",
    icon: "▣",
    color: "bg-black",
  },
  {
    id: 18,
    name: "Google Adwords",
    category: "Marketing",
    totalCost: "$35,193.60",
    icon: "G",
    color: "bg-blue-500",
  },
  {
    id: 19,
    name: "Project Management",
    category: "General",
    totalCost: "$54,120.00",
    icon: "▲",
    color: "bg-red-500",
  },
  {
    id: 20,
    name: "Email Marketing Platform",
    category: "Marketing",
    totalCost: "$64,800.00",
    icon: "▣",
    color: "bg-blue-900",
  },
  {
    id: 21,
    name: "Avanan",
    category: "IT and Security",
    totalCost: "$24,000.00",
    icon: "◢",
    color: "bg-red-500",
  },
];

export default function ContractList() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">
          <Link
            href="/contracts"
            className="text-blue-600 hover:underline"
          >
            Contracts
          </Link>
          <span className="mx-2">&gt;</span>
          <span>All</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl mb-4">Contract Management</h1>
        </div>

        {/* Contracts Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Toolbar */}
          <div className="bg-gray-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base">Contracts</span>
              <span className="text-sm text-gray-400">(Showing 23 of 23)</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-base flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>
              <button className="p-2.5 hover:bg-gray-700 rounded">
                <List className="w-5 h-5" />
              </button>
              <button className="p-2.5 hover:bg-gray-700 rounded">
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-gray-100 p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your contracts by name or vendor"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-base">
              <div className="text-gray-600">Results per page:</div>
              <select className="border border-gray-300 rounded px-3 py-2 text-base">
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>
          </div>

          {/* Contract Grid */}
          <div className="grid grid-cols-3 gap-6 p-8">
            {contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${contract.color} rounded flex items-center justify-center text-white text-lg flex-shrink-0`}
                  >
                    {contract.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 mb-2 truncate">
                      {contract.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="truncate">{contract.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Cost</div>
                      <div className="text-base font-semibold text-gray-900">
                        {contract.totalCost}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
