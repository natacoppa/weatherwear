---
status: pending
priority: p2
issue_id: "be-007"
tags: [backend, security, secrets, logging]
dependencies: []
---

# Gemini API key in URL + error logs may leak secrets

## Problem

Two secret-leakage risks:

1. **Gemini key in URL query string** (`src/app/api/outfit-image/route.ts:28`):
   ```
   ?key=${process.env.GEMINI_API_KEY}
   ```
   Google's documented pattern, but URL params appear in access logs, CDN logs, proxy logs, and error messages far more readily than request headers. If any observability tool records the URL of a server-side fetch, the key leaks into that tool.

2. **console.error logs full error objects** (`outfit-shopmy/route.ts:276`, `outfit-image/route.ts:56`). The Anthropic SDK's error objects sometimes contain the API key in auth-failure messages. The Gemini SDK's errors sometimes echo the request URL (with the embedded key from #1). Vercel logs retain these.

## Findings

Security sentinel (IMPORTANT #5, #6):
> If the Anthropic SDK throws with the API key in the error object (e.g., auth failure message), this goes to Vercel logs.
> Gemini key in URL — URL params appear in access logs more readily than headers.

## Proposed solutions

### Option A — Move Gemini key to header (if supported)
Gemini REST API also accepts `x-goog-api-key` header. Use it instead of `?key=`. One-line change.

### Option B — Redact logs
Wrap `console.error` with a redactor that strips API keys by regex from stringified errors before logging. Catches both Anthropic and Gemini cases.

### Recommended
Both. A removes one class of leakage entirely; B defends against SDK-side surprises.

## Acceptance

- [ ] Gemini key sent via header, not URL
- [ ] Error-log redactor wraps every `console.error` with raw SDK errors
- [ ] Test: throw fake Anthropic AuthError with embedded key; verify log output has key replaced

## Files

- `src/app/api/outfit-image/route.ts:28, 56`
- `src/app/api/outfit-shopmy/route.ts:276`
- New: `src/lib/redact.ts`
