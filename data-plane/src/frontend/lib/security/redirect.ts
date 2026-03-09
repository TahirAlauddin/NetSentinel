/**
 * Safe redirect utilities
 * Prevents open-redirect by ensuring redirect targets are same-origin paths.
 */

export interface GetSafeRedirectPathOptions {
  /**
   * Origin to treat as allowed (e.g. app origin).
   * Defaults to window.location.origin in the browser; pass explicitly for SSR or tests.
   */
  baseOrigin?: string;
}

/**
 * Resolves a redirect value to a same-origin path safe for client-side navigation.
 * Use for callbackUrl, redirect, or any user-supplied URL intended for post-auth redirect.
 *
 * @param value - Raw value from query/search params (e.g. callbackUrl, redirect)
 * @param options - Optional. baseOrigin for SSR/tests; in the browser it defaults to current origin.
 * @returns A path (pathname + search) safe to pass to router.push(), or null if invalid/off-origin.
 *
 * @example
 * // In browser (e.g. login page)
 * const path = getSafeRedirectPath(searchParams.get("redirect"));
 *
 * @example
 * // With explicit origin (SSR or tests)
 * const path = getSafeRedirectPath(callbackUrl, { baseOrigin: "https://app.example.com" });
 *
 * @example
 * // First of several params with default
 * const path = getSafeRedirectPath(callbackUrl) ?? getSafeRedirectPath(redirectParam) ?? "/dashboard";
 */
function resolveAbsoluteUrl(s: string, origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(s, origin);
    if (url.origin !== origin) return null;
    const path = url.pathname + url.search;
    return path.startsWith("//") ? null : path || "/";
  } catch {
    return null;
  }
}

export function getSafeRedirectPath(
  value: string | null | undefined,
  options: GetSafeRedirectPathOptions = {}
): string | null {
  const { baseOrigin } = options;
  const origin =
    baseOrigin ??
    (typeof window !== "undefined" ? window.location.origin : undefined);

  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;

  const isAbsoluteOrProtocolRelative = s.startsWith("//") || /^\w+:\/\//i.test(s);

  if (isAbsoluteOrProtocolRelative) {
    return resolveAbsoluteUrl(s, origin);
  }

  if (s.startsWith("/") && !s.startsWith("//")) return s;
  return null;
}
