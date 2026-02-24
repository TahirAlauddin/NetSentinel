"use client";

interface ContractDetailMetaProps {
  createdAt: string;
  updatedAt: string;
}

export function ContractDetailMeta({
  createdAt,
  updatedAt,
}: ContractDetailMetaProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="text-sm text-gray-500">
        Created {createdAt} · Updated {updatedAt}
      </div>
    </div>
  );
}
