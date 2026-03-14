/**
 * Optional error reporting to Sentry (or similar).
 * When NEXT_PUBLIC_SENTRY_DSN is set, errors are sent to Sentry in production.
 * In development we only log to console; production reporting is opt-in via env.
 */

export type ErrorReportContext = Record<string, unknown>;

/**
 * Report an error to the configured service (e.g. Sentry) in production.
 * No-op when NEXT_PUBLIC_SENTRY_DSN is not set or in development.
 */
export function reportError(error: unknown, context?: ErrorReportContext): void {
  if (process.env.NODE_ENV === "development") {
    return; // Already logged via logError in error-handler
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err, { extra: context });
  } catch {
    // @sentry/nextjs not installed or failed to load; ignore
  }
}
