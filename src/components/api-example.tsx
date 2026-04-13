export function ApiExample() {
  return (
    <pre className="text-[13px] md:text-[14px] leading-relaxed text-ink-subtle bg-card rounded-2xl p-5 overflow-x-auto border border-border">
      <code>{`GET /api/outfit-day?q=Los Angeles&day=0

{
  "location": "Los Angeles, California",
  "outfit": {
    "headline": "Linen layers, terracotta tones",
    "walkOut": {
      "top": "Rust cotton tee",
      "bottom": "Wide-leg linen trousers",
      "shoes": "Tan suede loafers"
    }
  }
}`}</code>
    </pre>
  );
}
