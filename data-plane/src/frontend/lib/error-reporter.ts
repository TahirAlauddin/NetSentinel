/**
 * Error reporting to Sentry. When NEXT_PUBLIC_SENTRY_DSN is set, errors are sent in production.
 * In development we only log via logError in error-handler.
 */

import * as Sentry from "@sentry/nextjs";

export type ErrorReportContext = Record<string, unknown>;

/**
 * Report an error to Sentry in production when DSN is configured.
 * No-op when NEXT_PUBLIC_SENTRY_DSN is not set or in development.
 */
export function reportError(error: unknown, context?: ErrorReportContext): void {
  if (process.env.NODE_ENV === "development") {
    return; // Already logged via logError in error-handler
  }

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { extra: context });
}
