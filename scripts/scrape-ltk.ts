/**
 * Scrape an LTK (shopltk.com) creator's product gallery.
 *
 * Usage:
 *   npx tsx scripts/scrape-ltk.ts <username> [--limit=100]
 *   npx tsx scripts/scrape-ltk.ts graceatwood --limit=50 > catalog.json
 *
 * Notes vs ShopMy:
 *  - LTK exposes `advertiser_name` (the retailer) but no explicit brand field.
 *    We store advertiser_name in `brand` — imperfect but consistent with the
 *    existing outfit-shopmy consumer shape.
 *  - LTK has no native category/department on products. We infer both from
 *    the product title via keyword rules. Anything unclassified falls into
 *    category="Other", department="Other" so the outfit generator can
 *    filter or drop it.
 *  - LTK product ids are UUID-like strings, not ints. If you integrate this
 *    with the current outfit-shopmy route, handle the id type accordingly.
 */

import { chromium, type Page } from "playwright";
import type { RawCreatorCatalog, RawCreatorProduct } from "../src/lib/creator-catalog";

type NormalizedProduct = RawCreatorProduct;

// ── Keyword classifier ───────────────────────────────────────────────
// Order matters: more specific rules first. First match wins.
const CATEGORY_RULES: { match: RegExp; category: string; department: string }[] = [
  // Shoes (includes multi-word "boat shoe")
  { match: /\b(sneaker|boot|bootie|heel|pump|loafer|mule|sandal|clog|mocassin|flat|oxford|slipper|boat shoe|driver|espadrille|derby)s?\b/i, category: "Shoes", department: "Shoes" },
  // Bags — "bucket bag" as compound before single-word "bucket" catches
  { match: /\b(tote|crossbody|shoulder bag|bucket bag|hobo|clutch|pouch|backpack|duffel|satchel|handbag|purse|minaudière|baguette bag)\b/i, category: "Bags", department: "Bags & Purses" },
  // Outerwear
  { match: /\b(coat|trench|parka|puffer|puffa|blazer|jacket|anorak|cape|overcoat|peacoat|windbreaker|bomber|vest|gilet)\b/i, category: "Outerwear", department: "Apparel" },
  // Knits & sweaters
  { match: /\b(sweater|cardigan|pullover|knit|cashmere|jumper|turtleneck|mock[- ]?neck|crewneck|rollneck|henley|sweatshirt|hoodie)\b/i, category: "Knits", department: "Apparel" },
  // Tops
  { match: /\b(tee|t[- ]?shirt|tank|cami|blouse|shirt|top|bodysuit|polo|button[- ]?up|button[- ]?down|surfsuit|swim top)\b/i, category: "Tops", department: "Apparel" },
  // Bottoms
  { match: /\b(jean|denim|trouser|pant|chino|legging|short|skirt|culotte|bermuda|cargo|slacks)s?\b/i, category: "Bottoms", department: "Apparel" },
  // Dresses
  { match: /\b(dress|gown|frock|jumpsuit|romper|caftan|kaftan|sundress|maxi|mini)\b/i, category: "Dresses", department: "Apparel" },
  // Accessories — includes caps/hats, socks, jewelry, belts, gloves
  { match: /\b(sunglasses|sunnies|scarf|scarves|hat|cap|beanie|beret|belt|watch|earring|necklace|ring|bracelet|hoop|cufflink|sock|glove|mitten|tie|bowtie|hair\s*clip|headband)s?\b/i, category: "Accessories", department: "Accessories" },
  // Beauty / skin (filterable out of outfits)
  { match: /\b(serum|cream|moisturiz|moisturis|lipstick|mascara|foundation|fragrance|perfume|cologne|cleanser|toner|mask|shampoo|conditioner|balm|lotion|candle|lip duo|lip oil|sunscreen|spf)\b/i, category: "Beauty", department: "Beauty" },
];

function cleanTitle(raw: string): string {
  // LTK titles often have product-card layout whitespace baked in — collapse
  // newlines and runs of spaces so the classifier and UI both see clean text.
  return raw.replace(/\s+/g, " ").trim();
}

function classify(title: string): { category: string; department: string } {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(title)) return { category: rule.category, department: rule.department };
  }
  return { category: "Other", department: "Other" };
}

// ── LTK API shapes (partial — only what we use) ──────────────────────

interface LtkActivity {
  profile_id: string;
  content_id: string;
  product_ref_id: string;
  content_type: string;
}

interface LtkActivitiesResponse {
  activities: LtkActivity[];
  meta?: { next?: string | null; limit?: number };
}

interface LtkProduct {
  product_reference_id: string;
  link_url: string | null;
  media_object_ids: string[];
}

interface LtkMediaObject {
  id: string;
  media_cdn_url: string | null;
}

interface LtkProductDetail {
  id: string;
  name: string;
  advertiser_name: string;
  price: number | null;
}

interface LtkProductsResponse {
  products: LtkProduct[];
  media_objects: LtkMediaObject[];
  product_details: LtkProductDetail[];
}

// ── Scraper ──────────────────────────────────────────────────────────

async function loadActivities(
  page: Page,
  profileId: string,
  limit: number,
): Promise<LtkActivity[]> {
  const all: LtkActivity[] = [];
  let next: string | null = "";
  const pageSize = 20; // matches LTK's default

  while (all.length < limit) {
    const params = new URLSearchParams({
      next: next || "",
      limit: String(pageSize),
    });
    const url = `https://api-gateway.rewardstyle.com/api/pub/v3/activities/products/profiles/${profileId}?${params}`;
    const batch = await page.evaluate(async (u: string) => {
      const r = await fetch(u);
      return (await r.json()) as unknown;
    }, url);

    const resp = batch as LtkActivitiesResponse;
    if (!resp.activities || resp.activities.length === 0) break;

    for (const a of resp.activities) {
      if (a.content_type !== "product-gallery") continue;
      all.push(a);
      if (all.length >= limit) break;
    }

    // Paginate via meta.next cursor (LTK returns it nested, not top-level).
    next = resp.meta?.next || null;
    if (!next) break;
    await page.waitForTimeout(400);
  }

  return all;
}

async function fetchProductBatch(
  page: Page,
  contentId: string,
  refIds: string[],
): Promise<LtkProductsResponse> {
  const params = new URLSearchParams();
  params.append("includes[]", "media_objects");
  params.append("includes[]", "product_references");
  for (const id of refIds) params.append("product_reference_ids[]", id);
  const url = `https://api-gateway.rewardstyle.com/api/ltk/v3/posts/${contentId}/products?${params}`;
  const data = await page.evaluate(async (u: string) => {
    const r = await fetch(u);
    return (await r.json()) as unknown;
  }, url);
  return data as LtkProductsResponse;
}

async function scrape(username: string, opts: { limit: number }) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  });
  const page = await ctx.newPage();

  // Step 1: load the profile page, capture profile_id + display name/avatar
  // from the first API call the SPA fires.
  let profileId: string | null = null;
  page.on("response", (res) => {
    const m = res.url().match(/\/profiles\/([0-9a-f-]{36})/);
    if (m && !profileId) profileId = m[1];
  });

  await page.goto(`https://shopltk.com/explore/${username}`, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForTimeout(4000);

  if (!profileId) {
    throw new Error(`Could not resolve profile_id for @${username}`);
  }
  console.error(`Resolved @${username} → profile_id ${profileId}`);

  // Pull display name + avatar from the DOM. LTK's SPA structure is not
  // stable; these selectors are best-effort.
  const avatar = await page
    .locator(`img[alt*="${username}" i], img[src*="avatar"], img[src*="profile"]`)
    .first()
    .getAttribute("src")
    .catch(() => null);
  const displayName = await page
    .locator(`h1:not(:has(img))`)
    .first()
    .textContent()
    .catch(() => null);

  // Step 2: paginate activities to collect product refs grouped by content_id.
  const activities = await loadActivities(page, profileId, opts.limit);
  console.error(`Collected ${activities.length} activity entries`);

  // Group product_ref_ids by content_id so we can batch-fetch by post.
  const byContent = new Map<string, string[]>();
  for (const a of activities) {
    const list = byContent.get(a.content_id) ?? [];
    list.push(a.product_ref_id);
    byContent.set(a.content_id, list);
  }

  // Step 3: batch-fetch product details.
  const BATCH_SIZE = 20;
  const products: NormalizedProduct[] = [];

  for (const [contentId, refIds] of byContent) {
    for (let i = 0; i < refIds.length; i += BATCH_SIZE) {
      const batch = refIds.slice(i, i + BATCH_SIZE);
      const data = await fetchProductBatch(page, contentId, batch);

      const mediaById = new Map<string, string>();
      for (const m of data.media_objects || []) {
        if (m.media_cdn_url) mediaById.set(m.id, m.media_cdn_url);
      }
      const detailById = new Map<string, LtkProductDetail>();
      for (const d of data.product_details || []) {
        detailById.set(d.id, d);
      }

      for (const p of data.products || []) {
        const detail = detailById.get(p.product_reference_id);
        if (!detail) continue;
        const imageId = p.media_object_ids?.[0];
        const image = imageId ? mediaById.get(imageId) : null;
        if (!image) continue; // skip products without images — not useful downstream
        const title = cleanTitle(detail.name);
        const { category, department } = classify(title);
        products.push({
          sourceProductId: p.product_reference_id,
          legacyId: p.product_reference_id,
          sourceRank: null,
          title,
          image,
          url: p.link_url,
          price: detail.price ?? null,
          brand: detail.advertiser_name || "",
          category,
          department,
          addedAt: null,
          addedAtSource: "unknown",
        });
      }

      await page.waitForTimeout(300); // be polite
    }
  }

  await browser.close();

  return {
    source: "ltk",
    username,
    name: displayName?.trim() || username,
    image: avatar,
    scrapedAt: new Date().toISOString(),
    sourceMeta: { profileId },
    products,
  } satisfies RawCreatorCatalog;
}

// ── CLI ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const username = args.find((a) => !a.startsWith("--"));
const limitArg = args.find((a) => a.startsWith("--limit="));

if (!username) {
  console.error("Usage: npx tsx scripts/scrape-ltk.ts <username> [--limit=100]");
  process.exit(1);
}

const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100;
console.error(`Scraping LTK catalog for @${username} (limit: ${limit})...`);

scrape(username, { limit })
  .then((result) => {
    console.error(`Found ${result.products.length} products across categories:`);
    const counts: Record<string, number> = {};
    for (const p of result.products) counts[p.category] = (counts[p.category] || 0) + 1;
    for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.error(`  ${cat}: ${n}`);
    }
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error("scrape failed:", err);
    process.exit(1);
  });
