---
status: complete
priority: p1
issue_id: "be-001"
tags: [backend, security, path-traversal]
dependencies: []
---

# Path traversal in creator data loading

## Problem

`src/app/api/outfit-shopmy/route.ts:32` — `loadCreatorData(username)` joins the raw `creator` query param into a filesystem path with no sanitization. A request like `?creator=../../.env` resolves to `data/creators/../../.env.json`. The `.json` suffix limits exploitation, but `?creator=../creators/_index` reads the index file, and null-byte tricks on older runtimes could be worse.

## Findings

Security sentinel (CRITICAL):
> `loadCreatorData(username)` joins the raw `creator` query param into a filesystem path with no sanitization. The `creator` param needs an allowlist check or a strict `^[a-z0-9_]+$` regex gate before it touches `path.join`.

## Proposed solutions

### Option A — Regex gate (recommended)
Validate `username` against `^[a-z0-9_-]{1,64}$` at top of handler; reject otherwise.

### Option B — Allowlist against `data/creators/_index.json`
Read the index file once at module scope; require `username` ∈ index. Stronger guarantee than regex.

## Acceptance

- [ ] `?creator=../../.env` returns 400
- [ ] `?creator=../creators/_index` returns 400
- [ ] Legit creator lookups still work
- [ ] Test covering the traversal path

## Files

- `src/app/api/outfit-shopmy/route.ts:32`
