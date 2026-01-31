/**
 * URL safety utilities for use in href, img src, etc.
 * Restricts to http/https to prevent javascript:, data:, and other schemes.
 */

/**
 * Returns the URL only if it is http or https. Use for links and images
 * when the URL comes from user/API input.
 *
 * @param value - Raw URL (e.g. provider.website, provider.logo_url)
 * @returns The string unchanged if valid http(s), otherwise null
 */
export function getSafeAbsoluteUrl(
  value: string | null | undefined
): string | null {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  try {
    const url = new URL(s);
    if (url.protocol === "http:" || url.protocol === "https:") return s;
    return null;
  } catch {
    return null;
  }
}
