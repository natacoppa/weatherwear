import { NextRequest, NextResponse } from "next/server";
// No requireApiKey here: this route is loaded via <img src> from the
// browser, which can't send custom headers. The SSRF host allowlist
// below is the real protection — bots can't use this proxy to fetch
// arbitrary URLs, only known-safe ShopMy/S3 CDNs.

// Hostname allowlist for the image proxy. Only CDNs we intentionally hotlink
// from are permitted. Matches both the canonical ShopMy CDN and the raw S3
// buckets in every region we've seen content served from (us-east-1,
// us-east-2). If a new region shows up, images will 400 until it's added.
const ALLOWED_HOSTS = new Set([
  "static.shopmy.us",
  "cdn.shopmy.us",
]);
const ALLOWED_HOST_PATTERNS: RegExp[] = [
  // ShopMy S3 buckets across any AWS region.
  /^production-shopmyshelf-(uploads|pins)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/,
];

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
    if (ALLOWED_HOSTS.has(parsed.hostname)) return true;
    return ALLOWED_HOST_PATTERNS.some((r) => r.test(parsed.hostname));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  // Rewrite first, then check. The rewrite canonicalizes S3 variants to
  // static.shopmy.us, so a us-east-2 URL becomes the allowlisted CDN host.
  const fetchUrl = rewriteUrl(url);
  if (!isAllowed(fetchUrl)) return new NextResponse("Host not allowed", { status: 400 });

  try {
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
