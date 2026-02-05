"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const contractData: Record<string, Record<string, unknown>> = {
  "1": {
    name: "Design/Prototyping",
    category: "Product and Design",
    icon: "🎨",
    color: "bg-yellow-400",
    vendor: "InVision",
    totalValue: "$9,600.00",
    monthlyCost: "$400.00",
    term: "Fixed term",
    daysRemaining: 323,
    startDate: "Dec 11, 2024",
    endDate: "Dec 25, 2026",
    trackingSpend: false,
    renewalPeriod: "60 days",
    createdBy: "-",
    nextAlert: "Aug 27, 2026",
    recipients: 2,
    contacts: [
      {
        name: "Susan Cooper",
        email: "susan.cooper@test.com",
        phone: "(323) 273-1980",
        initials: "SC",
        color: "bg-yellow-500",
      },
      {
        name: "Heather Walls",
        email: "heather.walls@test.com",
        phone: "(323) 273-1980",
        initials: "HW",
        color: "bg-orange-500",
      },
    ],
  },
};

export default function ContractDetail() {
  const params = useParams();
  const id = (params?.id as string) ?? "1";
  const contract =
    contractData[id] ??
    (contractData["1"] as Record<string, unknown> & { contacts: Array<{ name: string; email: string; phone: string; initials: string; color: string }> });

  const costData = [
    { name: "Used", value: 400, color: "#d1d5db" },
    { name: "Remaining", value: 9200, color: "#f3f4f6" },
  ];

  const contacts = (contract.contacts ?? []) as Array<{
    name: string;
    email: string;
    phone: string;
    initials: string;
    color: string;
  }>;

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">
          <Link href="/contracts" className="text-blue-600 hover:underline">
            Contracts
          </Link>
          <span className="mx-2">&gt;</span>
          <span>{String(contract.category)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Back Button */}
        <Link
          href="/contracts/list"
          className="inline-flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to all contracts
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start gap-6">
          <div
            className={`w-20 h-20 ${contract.color as string} rounded-lg flex items-center justify-center text-3xl`}
          >
            {String(contract.icon)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-5xl">{String(contract.name)}</h1>
              <button className="px-4 py-2 border border-gray-300 rounded text-base hover:bg-gray-50">
                + Add tag
              </button>
            </div>
            <div className="flex items-center gap-2 text-base">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-blue-600">{String(contract.vendor)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8">
            <button className="px-1 py-3 text-base text-blue-600 border-b-2 border-blue-600">
              Overview
            </button>
            <button className="px-1 py-3 text-base text-gray-600 hover:text-gray-900">
              Linked Contracts
            </button>
            <button className="px-1 py-3 text-base text-gray-600 hover:text-gray-900">
              History
            </button>
          </div>
        </div>

        {/* Contract Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-8">Contract Information</h2>

          <div className="grid grid-cols-4 gap-10 mb-10">
            <div>
              <div className="text-base text-gray-600 mb-2">Total Value</div>
              <div className="text-3xl">{String(contract.totalValue)}</div>
            </div>
            <div>
              <div className="text-base text-gray-600 mb-2">Monthly Cost</div>
              <div className="text-3xl">{String(contract.monthlyCost)}</div>
            </div>
            <div>
              <div className="text-base text-gray-600 mb-2">Term</div>
              <div className="text-xl">{String(contract.term)}</div>
            </div>
            <div>
              <div className="text-base text-gray-600 mb-2">Days Remaining</div>
              <div className="text-3xl">{String(contract.daysRemaining)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-base text-gray-600 mb-2">Start Date</div>
                <div className="text-base text-gray-900">
                  {String(contract.startDate)}
                </div>
              </div>
              <div>
                <div className="text-base text-gray-600 mb-2">End Date</div>
                <div className="text-base text-gray-900">
                  {String(contract.endDate)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-base text-gray-600 mb-2">Category</div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span className="text-base text-gray-900">
                    {String(contract.category)}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-base text-gray-600 mb-2">
                  Scheduled alerts
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">●</span>
                  <div className="flex-1 ml-3">
                    <div className="text-sm text-gray-600">Next alert</div>
                    <div className="text-base text-gray-900">
                      {String(contract.nextAlert)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Recipients</div>
                    <div className="text-base text-gray-900">
                      {String(contract.recipients)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-base text-gray-600 mb-2">Vendor</div>
                <div className="text-base text-gray-900">
                  {String(contract.vendor)}
                </div>
              </div>
              <div>
                <div className="text-base text-gray-600 mb-2">Product</div>
                <div className="text-base text-gray-900">-</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-base text-gray-600 mb-2">Tracking Spend</div>
                <div className="text-base text-gray-900">
                  {contract.trackingSpend ? "Yes" : "No"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-base text-gray-600 mb-2">
                  Renewal Notice Period
                </div>
                <div className="text-base text-gray-900">
                  {String(contract.renewalPeriod)}
                </div>
              </div>
              <div>
                <div className="text-base text-gray-600 mb-2">Created By</div>
                <div className="text-base text-gray-900">
                  {String(contract.createdBy)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-8">Contacts</h2>
          <div className="flex gap-8">
            {contacts.map((contact, index) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 ${contact.color} rounded-full flex items-center justify-center text-white font-medium text-lg`}
                >
                  {contact.initials}
                </div>
                <div>
                  <div className="text-base font-medium text-gray-900">
                    {contact.name}
                  </div>
                  <div className="text-base text-blue-600">{contact.email}</div>
                  <div className="text-base text-gray-600">{contact.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lifecycle */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-8">Lifecycle</h2>

          <div className="grid grid-cols-2 gap-16 mb-8">
            <div>
              <div className="text-base text-gray-600 mb-2">Start date</div>
              <div className="text-xl">{String(contract.startDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-base text-gray-600 mb-2">End date</div>
              <div className="text-xl">{String(contract.endDate)}</div>
            </div>
          </div>

          <div className="mb-6 text-center">
            <div className="text-base text-gray-600">Next notification date</div>
            <div className="text-base text-gray-900">
              {String(contract.nextAlert)}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"></div>
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rounded-full border-2 border-white"></div>
          </div>
        </div>

        {/* Finances */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-8">Finances</h2>

          <div className="flex items-center gap-16">
            <div className="relative" style={{ width: 240, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                    paddingAngle={0}
                  >
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-sm text-gray-600">Monthly Cost</div>
                <div className="text-2xl font-semibold">
                  {String(contract.monthlyCost)}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="text-base text-gray-600 mb-3">
                {String(contract.name)} accounts for{" "}
                <span className="text-green-600 font-medium">
                  less than 1 percent
                </span>{" "}
                of your monthly contract expenditures.
              </div>
              <div className="text-sm text-gray-500">
                Total cost: {String(contract.totalValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-6">Locations</h2>
          <div className="text-base text-gray-500 italic">
            You don&apos;t have any locations for this contract.
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-6">Departments</h2>
          <div className="text-base text-gray-500 italic">
            You don&apos;t have any departments for this contract.
          </div>
        </div>

        {/* Related Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl mb-6">Related Items</h2>
          <div className="text-base text-gray-500 italic">
            Link other items from your company to this contract. This contract
            will be automatically linked in the selected related item&apos;s
            details.
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl mb-6">Notes</h2>
          <div className="text-base text-gray-900">Design.</div>
        </div>
      </div>
    </div>
  );
}
