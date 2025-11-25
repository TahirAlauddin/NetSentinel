"use client";

import { useAssetForm } from "./AssetFormContext";

interface StepDefinition {
  id: string;
  label: string;
  icon: null | string;
}

interface AssetFormStepsProgressProps {
  steps: readonly StepDefinition[];
}

/**
 * StepsProgress component displays the progress indicator for multi-step form
 * Shows simplified progress bar on mobile/tablet, full steps list on desktop
 * Uses context for currentStep and handleStepClick
 */
export function AssetFormStepsProgress({ steps }: AssetFormStepsProgressProps) {
  const { currentStep, handleStepClick } = useAssetForm();
  return (
    <>
      {/* Mobile/Tablet: Simplified progress bar */}
      <div className="md:hidden mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-2 px-1">
          <p className="text-xs font-medium text-blue-700">{steps[currentStep]?.label}</p>
        </div>
      </div>

      {/* Desktop: Full steps list */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 p-4 lg:p-6 sticky top-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Progress</h3>
        <div className="flex flex-col items-start gap-0">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-start flex-shrink-0 w-full">
              {/* Step Content: Circle + Text */}
              <div
                className="flex items-center gap-3 cursor-pointer group w-full"
                onClick={() => {
                  // Allow clicking on completed or current step
                  if (index <= currentStep) {
                    handleStepClick(index);
                  }
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition flex-shrink-0 ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                      ? "bg-blue-600 text-white ring-2 ring-blue-200"
                      : "bg-gray-300 text-gray-700 group-hover:bg-gray-400"
                  }`}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-medium ${
                      index === currentStep
                        ? "text-blue-600"
                        : index < currentStep
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
              {/* Vertical connector for desktop - outside the step content */}
              {index < steps.length - 1 && (
                <div
                  className={`w-1 h-6 ml-4 transition ${
                    index < currentStep ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
