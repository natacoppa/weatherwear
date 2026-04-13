const TICKER_ITEMS = [
  "Los Angeles 72° — Rust cotton tee, linen trousers",
  "Tokyo 58° — Navy wool coat, cream turtleneck",
  "Paris 64° — Camel trench, black ankle boots",
  "New York 45° — Charcoal peacoat, burgundy scarf",
  "London 52° — Olive rain jacket, dark denim",
  "Sydney 80° — White linen shirt, tan shorts",
  "Mexico City 68° — Terracotta blouse, wide-leg pants",
  "Copenhagen 40° — Black puffer, wool beanie",
  "Marrakech 88° — Loose cotton caftan, sandals",
  "Seoul 55° — Layered knit, pleated midi skirt",
];

export function Ticker({ reverse = false }: { reverse?: boolean }) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div
        className={`inline-flex gap-8 ${reverse ? "animate-[tickerReverse_60s_linear_infinite]" : "animate-[ticker_60s_linear_infinite]"}`}
      >
        {items.map((item, i) => (
          <span key={i} className="text-[13px] text-ink-whisper tracking-wide">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
