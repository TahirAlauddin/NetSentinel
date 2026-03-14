/**
 * Centralized error handling utilities
 * 
 * Provides consistent error handling patterns, user-friendly error messages,
 * and error logging functionality across the application.
 */

import { parseApiError, type ParsedError } from "./api-client/error-parser";
import type { BaseApiResponse } from "../types/api-client";
import { reportError as sendToErrorService } from "./error-reporter";

/**
 * Error types for different error scenarios
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}
 
/**
 * Standardized error object
 */
export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
  originalError?: unknown;
}

/**
 * Get error type from HTTP status code
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  if (status >= 400 && status < 500) {
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.AUTHORIZATION;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status === 422) return ErrorType.VALIDATION;
    return ErrorType.VALIDATION;
  }
  if (status >= 500) {
    return ErrorType.SERVER;
  }
  return ErrorType.UNKNOWN;
}

/**
 * Get error type from error object
 */
export function getErrorTypeFromError(error: unknown): ErrorType {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return ErrorType.NETWORK;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return ErrorType.NETWORK;
  }
  return ErrorType.UNKNOWN;
}

/**
 * Create user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return "Unable to connect to the server. Please check your internet connection and try again.";
    case ErrorType.AUTHENTICATION:
      return "Your session has expired. Please sign in again.";
    case ErrorType.AUTHORIZATION:
      return "You don't have permission to perform this action.";
    case ErrorType.NOT_FOUND:
      return "The requested resource was not found.";
    case ErrorType.VALIDATION:
      return error.message || "Please check your input and try again.";
    case ErrorType.SERVER:
      return "A server error occurred. Please try again later or contact support if the problem persists.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}

/**
 * Handle API response error
 */
export function handleApiError<T>(
  response: BaseApiResponse<T>
): AppError {
  const errorType = response.status
    ? getErrorTypeFromStatus(response.status)
    : ErrorType.UNKNOWN;

  let parsedError: ParsedError | null = null;
  if (response.errorData) {
    parsedError = parseApiError(response.errorData);
  }

  const message = parsedError?.message || response.error || "Request failed";
  const userMessage = getUserFriendlyMessage({
    type: errorType,
    message,
    userMessage: "",
  });

  return {
    type: errorType,
    message,
    userMessage,
    statusCode: response.status,
    fieldErrors: parsedError?.fieldErrors,
    originalError: response.errorData,
  };
}

/**
 * Handle caught error (from try/catch blocks)
 */
export function handleCaughtError(error: unknown): AppError {
  const errorType = getErrorTypeFromError(error);

  let message = "An unexpected error occurred";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  const userMessage = getUserFriendlyMessage({
    type: errorType,
    message,
    userMessage: "",
  });

  return {
    type: errorType,
    message,
    userMessage,
    originalError: error,
  };
}

/**
 * Log error for debugging and monitoring.
 * In development logs to console; in production sends to error reporting service (e.g. Sentry) when configured.
 */
export function logError(error: AppError, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("Error occurred:", {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      statusCode: error.statusCode,
      fieldErrors: error.fieldErrors,
      context,
      originalError: error.originalError,
    });
  }

  const payload = {
    type: error.type,
    message: error.message,
    userMessage: error.userMessage,
    statusCode: error.statusCode,
    fieldErrors: error.fieldErrors,
    ...context,
  };
  sendToErrorService(error.originalError ?? error, payload);
}

/**
 * Handle error and return standardized error object
 * This is the main function to use for error handling
 */
export function handleError(
  error: unknown | BaseApiResponse<unknown>,
  context?: Record<string, unknown>
): AppError {
  let appError: AppError;

  // Check if it's an API response error
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "error" in error
  ) {
    appError = handleApiError(error as BaseApiResponse<unknown>);
  } else {
    appError = handleCaughtError(error);
  }

  // Log the error
  logError(appError, context);

  return appError;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: AppError): boolean {
  return error.type === ErrorType.VALIDATION;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: AppError): boolean {
  return error.type === ErrorType.NETWORK;
}

/**
 * Check if error is an authentication error
 */
export function isAuthenticationError(error: AppError): boolean {
  return error.type === ErrorType.AUTHENTICATION;
}

/**
 * Check if error is an authorization error
 */
export function isAuthorizationError(error: AppError): boolean {
  return error.type === ErrorType.AUTHORIZATION;
}

