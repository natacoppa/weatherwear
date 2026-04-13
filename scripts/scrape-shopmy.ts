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

interface ShopMyProduct {
  id: number;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category: string;
  department: string;
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

    for (const item of batch.results) {
      allProducts.push({
        id: item.Product_id || item.id,
        title: item.title,
        image: item.image,
        url: item.fallbackUrl || null,
        price: item.fallbackPrice || null,
        brand: item.AllBrand_name,
        category: item.Category_name,
        department: item.Department_name,
      });
    }

    offset += batch.results.length;
    if (batch.results.length < batchLimit) break; // No more pages

    await page.waitForTimeout(500); // Be polite
  }

  await browser.close();
  return allProducts;
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

scrape(username, { limit, department }).then((products) => {
  console.error(`Found ${products.length} products`);
  console.log(JSON.stringify(products, null, 2));
});
