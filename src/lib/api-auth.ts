import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "./rate-limit";

// Shared secret sent by the frontend on every /api call. Not cryptographic
// auth — the value is public-readable via NEXT_PUBLIC_WW_API_KEY in the
// client bundle. Purpose: stop drive-by bot probes that don't load the
// frontend's JS first. Determined attackers who scrape the page will still
// get through (that's what rate limiting + Vercel Firewall are for).

const HEADER = "x-ww-key";

export function requireApiKey(req: NextRequest): NextResponse | null {
  // `.trim()` defends against env values that accidentally include a
  // trailing newline (easy to do when piping `echo` into `vercel env add`).
  const expected = process.env.WW_API_KEY?.trim();

  // If the env var isn't configured (local dev without the key),
  // allow requests through — saves setup friction. Production always has
  // the var set (Vercel env), so this only bypasses on a dev machine.
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error("WW_API_KEY missing in production — API is unguarded");
    }
    return null;
  }

  const provided = req.headers.get(HEADER)?.trim();
  if (provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() },
    );
  }
  return null;
}
