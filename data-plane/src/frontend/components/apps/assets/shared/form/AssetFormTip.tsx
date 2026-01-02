import { Card } from "@/components/ui/card";
import React from "react";

export const AssetFormTip = () => {
  return (
    <div className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-4">
        <Card className="p-4 lg:p-6 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Tips and Tricks
          </h3>
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                Assets you add are referenced throughout the platform! Be sure
                to use a distinct and memorable name for your asset so you can
                easily identify it.
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                Set your warranty expiration date and we&apos;ll remind you when
                this asset warranty is about to expire!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
