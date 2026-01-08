/**
 * Error parser for Django REST Framework API responses
 * Handles field-level errors, non-field errors, and general error messages
 */

export interface ParsedError {
  message: string
  fieldErrors?: Record<string, string[]>
  nonFieldErrors?: string[]
  raw?: unknown
}

/**
 * Build a comprehensive error message from field and non-field errors
 * @param fieldErrors - Record of field names to error messages
 * @param nonFieldErrors - Array of non-field error messages
 * @returns Comprehensive error message
 */
const buildErrorMessage = (fieldErrors: Record<string, string[]>, nonFieldErrors: string[]): string | undefined => {
    let message;
    // If there are non-field errors or field errors, build the error message
    if (nonFieldErrors.length > 0 || Object.keys(fieldErrors).length > 0) {
        // Example: ["End date must be after start date.", "Name: This field is required."]
        const errorParts: string[] = []
        // Add non-field errors to the error parts
        if (nonFieldErrors.length > 0) {
          errorParts.push(...nonFieldErrors)
        }
        // Add field errors to the error parts
        for (const [field, errors] of Object.entries(fieldErrors)) {
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          errorParts.push(`${fieldName}: ${errors.join(', ')}`)
        }
    
        // Join the error parts with a semicolon
        // Example: "End date must be after start date.; Name: This field is required."
        if (errorParts.length > 0) {
          message = errorParts.join('; ')
        }
      }
    return message
}

/**
 * Parse Django REST Framework error response
 * @param errorData - The error data from the API response
 * @returns Parsed error with message and structured error data
 */
export function parseApiError(errorData: unknown): ParsedError {
  if (!errorData || typeof errorData !== 'object') {
    return {
      message: 'Request failed',
      raw: errorData,
    }
  }

  const fieldErrors: Record<string, string[]> = {}
  const nonFieldErrors: string[] = []
  let message = 'Request failed'

  for (const [key, value] of Object.entries(errorData)) {
    // Handle single error message fields
    if (key === 'detail' || key === 'message') {
      message = String(value)
      continue
    }

    // Handle non-field errors
    //               key                  value (array)
    //                ↓                     ↓
    // Example: { "non_field_errors": [ "End date must be after start date." ] }
    if (key === 'non_field_errors') {
      if (Array.isArray(value)) {
        nonFieldErrors.push(...value.map(v => String(v)))
      } else {
        nonFieldErrors.push(String(value))
      }
      continue
    }

    // Handle field-specific errors
    //            key     value (array)
    //             ↓         ↓
    // Example: { "name": [ "This field may not be blank." ] }
    if (Array.isArray(value) && value.length > 0) {
      fieldErrors[key] = value.map(v => String(v))
    }
  }

  // Build comprehensive error message
  message = buildErrorMessage(fieldErrors, nonFieldErrors) || message

  return {
    message,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    nonFieldErrors: nonFieldErrors.length > 0 ? nonFieldErrors : undefined,
    raw: errorData,
  }
}

/**
 * Format field errors for display
 * @param fieldErrors - Record of field names to error messages
 * @returns Formatted string
 */
export function formatFieldErrors(fieldErrors: Record<string, string[]>): string {
  return Object.entries(fieldErrors)
    .map(([field, errors]) => {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      return `${fieldName}: ${errors.join(', ')}`
    })
    .join('; ')
}
