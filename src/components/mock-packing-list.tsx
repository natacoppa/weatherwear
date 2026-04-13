import Image from "next/image";

export function MockPackingList() {
  return (
    <div className="bg-card w-full">
      {/* Hero with destination */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src="/lifestyle/tokyo-trip.jpg" alt="Tokyo trip" width={600} height={338} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-white drop-shadow-md font-medium">Packing for</p>
            <p className="font-[var(--font-serif)] text-[24px] text-white drop-shadow-md leading-none mt-0.5">Tokyo</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-foreground font-medium">5 days</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-4">
        {/* Day strip */}
        <div className="mb-4 pb-4 border-b border-input">
          <p className="text-[8px] uppercase tracking-[0.22em] text-ink-soft mb-2">Day by day</p>
          <div className="flex gap-1.5">
            {[
              { day: "Sat", temp: "60°" },
              { day: "Sun", temp: "68°" },
              { day: "Mon", temp: "72°", active: true },
              { day: "Tue", temp: "65°", rain: true },
              { day: "Wed", temp: "58°" },
            ].map((d, i) => (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl border shrink-0 ${
                  d.active ? "bg-primary border-primary text-primary-foreground" : "bg-popover border-input"
                }`}
              >
                <span className={`text-[8px] uppercase tracking-[0.15em] ${d.active ? "text-primary-foreground/70" : "text-ink-soft"}`}>
                  {d.day}
                </span>
                <span
                  className={`font-[var(--font-serif)] text-[14px] leading-none mt-0.5 ${d.active ? "text-primary-foreground" : "text-foreground"}`}
                >
                  {d.temp}
                </span>
                {d.rain && <span className="text-[8px] text-clay-warm mt-0.5">30%</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Headline */}
        <h4 className="font-[var(--font-serif)] text-[20px] text-foreground leading-[1.15] tracking-[-0.01em] mb-2">
          Quiet luxury in cashmere
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 pb-4 border-b border-input">
          Cool mornings, mild afternoons. Neutral layering, architectural tailoring.
        </p>

        {/* Palette (outfit data — hex kept intentional) */}
        <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-input">
          <span className="text-[8px] uppercase tracking-[0.2em] text-ink-soft mr-1">Palette</span>
          {[
            { hex: "#ece4d2", label: "Cream", light: true },
            { hex: "#d4c4a0", label: "Oatmeal" },
            { hex: "#a8896a", label: "Camel" },
            { hex: "#6b5338", label: "Tobacco" },
            { hex: "#3a2c1e", label: "Chocolate" },
          ].map((c) => (
            <span
              key={c.label}
              className={`w-5 h-5 rounded-full shadow-sm ${c.light ? "border border-input" : ""}`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          ))}
        </div>

        {/* Categories */}
        <p className="text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-3">The list</p>
        <div className="space-y-2.5">
          {[
            { name: "Knits", desc: "Cashmere crew, silk mock-neck, fine merino", count: 4 },
            { name: "Tailoring", desc: "Wool trousers, pleated skirt, silk slip", count: 3 },
            { name: "Outerwear", desc: "Oatmeal double-breasted coat, cashmere wrap", count: 2 },
            { name: "Shoes", desc: "Leather loafers, suede mules", count: 2 },
          ].map((cat, i, arr) => (
            <div
              key={cat.name}
              className={`flex items-start justify-between gap-3 ${i < arr.length - 1 ? "pb-2.5 border-b border-input" : ""}`}
            >
              <div>
                <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none mb-1">{cat.name}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{cat.desc}</p>
              </div>
              <span className="text-[11px] font-medium text-foreground bg-popover border border-input rounded-full px-2 py-0.5 shrink-0">
                {cat.count}
              </span>
            </div>
          ))}
        </div>

        {/* Pro tip */}
        <div className="mt-4 p-3 rounded-xl bg-olive/10">
          <div className="flex items-start gap-2">
            <span className="text-[12px]">💡</span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.22em] text-olive font-medium mb-0.5">Pro tip</p>
              <p className="text-[11px] text-foreground italic leading-snug">
                Stick to one color family — travel photos look curated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
