"use client"

import { Input } from "@/components/ui/input"
import { Calendar } from "lucide-react"
import { FormField } from "../FormField"

interface DateFieldProps {
  label: string
  id?: string
  value: string
  onChange: (value: string) => void
  optional?: boolean
  className?: string
  error?: string
}

/**
 * Reusable date input field with calendar icon
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  optional,
  className = "",
  error,
}: DateFieldProps) {
  return (
    <FormField id={id} label={label} optional={optional} className={className} error={error}>
      <div className="relative">
        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          type="date"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 border rounded-lg ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
      </div>
    </FormField>
  )
}

