---
status: complete
priority: p1
issue_id: "005"
tags: [code-review, security, xss, ssrf]
dependencies: []
---

# javascript: URL injection in <a href> + unrestricted /api/img proxy (SSRF)

## Problem statement

Two security findings that both involve externally-sourced URLs being trusted:

**1. `javascript:` href injection** — `src/components/creator-card.tsx` and `src/components/outfit-collage.tsx` render `<a href={item.url || "#"}>` where `item.url` comes from ShopMy catalog data. React does not sanitize `href` props. If catalog data were ever poisoned (future compromised upstream API, supply-chain edit of scraped JSON, or a creator mode added that consumes user-controlled URLs), a `javascript:alert(1)` href would execute on click. `target="_blank" rel="noopener noreferrer"` does NOT prevent this.

**2. `/api/img` open proxy (SSRF)** — `src/app/api/img/route.ts` accepts an arbitrary `url` param and fetches it server-side. `rewriteUrl` only transforms ShopMy S3 URLs; everything else passes through. An attacker can request `/api/img?url=http://169.254.169.254/...` or internal hostnames. On Vercel serverless the IMDS risk is lower than EC2/GCP, but the server can still be used as an open proxy to probe networks reachable from deployment.

## Findings

From Security sentinel:
> **SSRF via /api/img image proxy — IMPORTANT.** The proxy accepts an arbitrary `url` query param and fetches it server-side with no allowlist.
> **`javascript:` URL injection in `<a href>` — IMPORTANT.** Both components render `<a href={item.url || "#"}>`. React does not sanitize `href` props. The `target="_blank" rel="noopener noreferrer"` attrs do not prevent `javascript:` execution.

## Proposed solutions

### Option A — `safeHref()` helper + `/api/img` allowlist (recommended)
- New `src/lib/safe-href.ts`: rejects anything not starting with `https://` or `http://`, returns `"#"` otherwise
- Wrap all three callsites: outfit-collage (5 links), creator-card (2 link blocks)
- In `src/app/api/img/route.ts`: allowlist host patterns (`static.shopmy.us`, `cdn.shopmy.us`, `*.amazonaws.com` with known prefix) and reject `file://`, `localhost`, RFC1918 ranges
- Pros: Defense-in-depth against catalog poisoning + SSRF; small change; easy to test
- Cons: Adds a few conditionals
- Effort: Small

### Option B — Trust upstream data, monitor
- Rely on ShopMy JSON being the only source and being trusted
- Pros: Zero churn
- Cons: Any future upstream change or supply-chain incident re-exposes both vectors; SSRF is always latent
- Effort: None

## Recommended action
_(Fill during triage)_

## Technical details

- **New file:** `src/lib/safe-href.ts`
- **Touch:** `src/components/outfit-collage.tsx` (lines 20, 32, 44, 58, 69), `src/components/creator-card.tsx` (product links + accessory links), `src/app/api/img/route.ts`
- **Test:** unit test `safeHref("javascript:alert(1)") === "#"`, `safeHref("https://ex.com") === "https://ex.com"`, `safeHref("data:text/html,...") === "#"`

## Acceptance criteria

- [ ] `safeHref()` utility exported from `src/lib/safe-href.ts` with unit tests
- [ ] All `<a href={item.url || "#"}>` callsites pass `item.url` through `safeHref`
- [ ] `/api/img` returns 400 for URLs outside the allowlist
- [ ] `/api/img` still works for legitimate ShopMy/LTK CDN URLs

## Work log

_(Fill when started)_

## Resources

- Security findings 1, 2
- [OWASP SSRF](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)
