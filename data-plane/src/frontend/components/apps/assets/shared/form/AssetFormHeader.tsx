import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export function AssetFormHeader() {
  const router = useRouter();
  return (
    <div className="mb-6 lg:mb-8">
      <button
        onClick={() => router.push("/assets")}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all assets
      </button>

      <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="text-blue-600 text-xl sm:text-2xl">📋</div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            New Asset
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Tell us about this asset. Many of the fields are optional, although
            we highly recommend filling out as many as you can for a more
            accurate snapshot!
          </p>
        </div>
      </div>
    </div>
  );
}
