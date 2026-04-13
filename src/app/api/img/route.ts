import { NextRequest, NextResponse } from "next/server";

// Hostname allowlist for the image proxy. Only CDNs we intentionally hotlink
// from are permitted; anything else gets a 400. Prevents the proxy from
// being used for SSRF against internal hosts (metadata endpoints, etc.) or
// as an open redirect/bandwidth sink.
const ALLOWED_HOSTS = new Set([
  "static.shopmy.us",
  "cdn.shopmy.us",
  "production-shopmyshelf-uploads.s3.amazonaws.com",
  "production-shopmyshelf-uploads.s3.us-east-1.amazonaws.com",
  "production-shopmyshelf-pins.s3.amazonaws.com",
  "production-shopmyshelf-pins.s3.us-east-1.amazonaws.com",
]);

function rewriteUrl(url: string): string {
  // Rewrite all ShopMy S3 URLs to static.shopmy.us which allows public access
  const uploadsMatch = url.match(/production-shopmyshelf-uploads\.s3[^/]*\.amazonaws\.com\/(.+)/);
  if (uploadsMatch) return `https://static.shopmy.us/uploads/${uploadsMatch[1]}`;

  const pinsMatch = url.match(/production-shopmyshelf-pins\.s3[^/]*\.amazonaws\.com\/(.+)/);
  if (pinsMatch) return `https://static.shopmy.us/pins/${pinsMatch[1]}`;

  return url;
}

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  if (!isAllowed(url)) return new NextResponse("Host not allowed", { status: 400 });

  try {
    const fetchUrl = rewriteUrl(url);
    // The rewrite target is always static.shopmy.us which is in the allowlist,
    // but re-check defensively in case rewriteUrl changes.
    if (!isAllowed(fetchUrl)) return new NextResponse("Host not allowed", { status: 400 });

    const res = await fetch(fetchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return new NextResponse("Image fetch failed", { status: 502 });

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
