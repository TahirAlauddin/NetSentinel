"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewContractPage() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">
          <Link href="/contracts" className="text-blue-600 hover:underline">
            Contracts
          </Link>
          <span className="mx-2">&gt;</span>
          <span>Add Contract</span>
        </div>
      </div>

      <div className="p-8">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to overview
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl mb-4">Add Contract</h1>
          <p className="text-gray-600">
            Contract creation form will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
