import { NextRequest, NextResponse } from "next/server";

const hits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 50;

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 50 requests per hour." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) } },
    );
  }

  return null;
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
