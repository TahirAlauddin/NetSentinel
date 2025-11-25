"use client";

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  children?: React.ReactNode;
  className?: string;
  error?: string;
}

/**
 * Reusable form field wrapper component
 * Displays a label, required and optional indicators, and an error message if provided
 * @param label - The label for the field
 * @param required - Whether the field is required
 * @param optional - Whether the field is optional
 * @param children - The children of the field
 * @param className - The class name for the field
 * @param error - The error message for the field
 * @returns The form field component
 */
export function FormField({
  label,
  required,
  optional,
  children,
  className = "",
  error,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
        {required && <span className="text-red-600"> *</span>}
        {optional && <span className="text-gray-500 text-xs"> (optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
