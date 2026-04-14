/**
 * Scrape a ShopMy curator's product catalog.
 *
 * Usage:
 *   npx tsx scripts/scrape-shopmy.ts <username> [--limit=100] [--category=Apparel]
 *
 * Outputs JSON to stdout. Pipe to a file:
 *   npx tsx scripts/scrape-shopmy.ts grace-atwood --limit=50 > catalog.json
 */

import { chromium } from "playwright";
import { buildShopMyAffiliateUrl, type RawCreatorCatalog, type RawCreatorProduct } from "../src/lib/creator-catalog";

interface ShopMyProduct extends RawCreatorProduct {
  title: string;
}

const API_BASE = "https://apiv3.shopmy.us/api";

async function scrape(username: string, opts: { limit: number; department?: string }) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Establish session cookies
  await page.goto("https://shopmy.us", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);

  const allProducts: ShopMyProduct[] = [];
  const pageSize = 48;
  let offset = 0;
  let curatorId: number | null = null;

  while (allProducts.length < opts.limit) {
    const batchLimit = Math.min(pageSize, opts.limit - allProducts.length);

    const params = new URLSearchParams({
      Curator_username: username,
      tab: "popular",
      limit: String(batchLimit),
      Industry_id: "1", // Fashion & Accessories
      ...(offset > 0 ? { offset: String(offset) } : {}),
      ...(opts.department ? { Department_name: opts.department } : {}),
    });

    const batch = await page.evaluate(async (url: string) => {
      const res = await fetch(url);
      return await res.json();
    }, `${API_BASE}/Shop/products?${params}`);

    if (!batch.success || !batch.results?.length) break;

    curatorId ||= batch.results[0]?.Curator_id || batch.results[0]?.curatorId || null;

    for (const [index, item] of batch.results.entries()) {
      const productId = item.Product_id || item.id;
      allProducts.push({
        sourceProductId: String(productId),
        legacyId: productId,
        sourceRank: offset + index,
        title: item.title,
        image: item.image,
        url: buildShopMyAffiliateUrl(productId, curatorId) || item.fallbackUrl || null,
        price: item.fallbackPrice || null,
        brand: item.AllBrand_name,
        category: item.Category_name,
        department: item.Department_name,
        addedAt: null,
        addedAtSource: "scraped_at",
      });
    }

    offset += batch.results.length;
    if (batch.results.length < batchLimit) break; // No more pages

    await page.waitForTimeout(500); // Be polite
  }

  await browser.close();
  const scrapedAt = new Date().toISOString();
  return {
    source: "shopmy",
    username,
    name: username,
    image: null,
    scrapedAt,
    sourceMeta: { curatorId },
    products: allProducts.map((product) => ({ ...product, addedAt: scrapedAt })),
  } satisfies RawCreatorCatalog;
}

// ── CLI ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const username = args.find((a) => !a.startsWith("--"));
const limitArg = args.find((a) => a.startsWith("--limit="));
const deptArg = args.find((a) => a.startsWith("--department="));

if (!username) {
  console.error("Usage: npx tsx scripts/scrape-shopmy.ts <username> [--limit=100] [--department=Apparel]");
  process.exit(1);
}

const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 100;
const department = deptArg ? deptArg.split("=")[1] : undefined;

console.error(`Scraping ShopMy catalog for @${username} (limit: ${limit})...`);

scrape(username, { limit, department }).then((catalog) => {
  console.error(`Found ${catalog.products.length} products`);
  console.log(JSON.stringify(catalog, null, 2));
});
