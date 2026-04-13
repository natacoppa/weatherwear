// Returns the input URL only if it's safe to use as an <a href>.
// Rejects javascript:, data:, vbscript:, file:, and other scripting schemes.
// Allows http(s), mailto, tel, protocol-relative, path-relative, and anchors.
//
// Stripping ASCII control chars first defends against smuggled schemes like
// `java\tscript:alert(1)` — browsers strip them during URL parsing, so we
// have to do the same before checking.
//
// React does not sanitize href props, so wrap untrusted URLs (scraped
// catalog data, user-submitted content) at every <a> callsite.

const SAFE_SCHEME = /^(https?|mailto|tel):/i;
const RELATIVE_OR_ANCHOR = /^(\/\/|\/|#|\?)/;

export function safeHref(url: string | null | undefined): string {
  if (!url) return "#";
  const trimmed = url.trim().replace(/[\u0000-\u001F]/g, "");
  if (!trimmed) return "#";
  if (RELATIVE_OR_ANCHOR.test(trimmed)) return url;
  if (SAFE_SCHEME.test(trimmed)) return url;
  return "#";
}
