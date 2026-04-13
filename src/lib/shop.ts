// Builds a Google Shopping search URL from an outfit item label.
// Strips leading qty, trailing brand attributions, and parentheticals so
// the shopper lands on a query like "rust cotton tee" instead of
// "2 Rust cotton tee — Everlane (size M)".
export function shopUrl(text: string): string {
  const cleaned = text
    .replace(/^\d+\s*/g, "") // leading qty
    .replace(/\s*—.*$/, "") // em-dash suffix (brand/attribution)
    .replace(/\s*\(.*?\)\s*/g, "") // parentheticals
    .trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(cleaned)}`;
}
