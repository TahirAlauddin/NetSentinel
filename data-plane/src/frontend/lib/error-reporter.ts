/**
 * Error reporting.
 *
 * Sentry is intentionally disabled for now.
 * We keep this module (and the `reportError` API) so existing callers
 * don't need to change.
 */

export type ErrorReportContext = Record<string, unknown>;

/**
 * Report an error to the error reporting service.
 *
 * Temporarily no-op (Sentry disabled).
 */
export function reportError(error: unknown, context?: ErrorReportContext): void {
  // Intentionally disabled.
  // `error` and `context` are accepted so callsites remain stable.
  void error;
  void context;
}
