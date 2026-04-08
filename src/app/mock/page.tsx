"use client";

// Mock outfit data to test the flat-lay image layout
const mockOutfit = {
  headline: "Heavy winter armor morning, softer by night",
  location: "Toronto, Ontario, Canada",
  day: { tempMin: 22, tempMax: 38, uvIndexMax: 3.2, precipitationProbability: 15 },
  walkOut: {
    summary: "Brutal wind chill — serious insulation needed",
    items: [
      { label: "Top", name: "Merino wool base layer", img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop" },
      { label: "Layer", name: "Down parka with hood", img: "https://images.unsplash.com/photo-1544923246-77307dd270b4?w=200&h=200&fit=crop" },
      { label: "Bottom", name: "Wool-lined trousers", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop" },
      { label: "Shoes", name: "Insulated leather boots", img: "https://images.unsplash.com/photo-1542840410-3092f99611a3?w=200&h=200&fit=crop" },
    ],
    accessories: ["Wool beanie", "Lined gloves", "Wool scarf"],
  },
  carry: {
    summary: "Sun warms it up slightly — shed parka indoors",
    remove: ["Parka — stash at coat check or office"],
    add: ["Sunglasses if outdoors"],
    note: "Keep parka accessible for evening",
  },
  evening: {
    summary: "Drops back to freezing — layer everything back on",
    add: ["Parka back on", "Scarf and gloves back on"],
    note: "Wind picks up after sunset",
  },
  bagEssentials: ["Lip balm", "Hand warmers", "Sunglasses"],
};

function Scallop() {
  return (
    <div className="w-full h-3 flex items-center justify-center overflow-hidden">
      <div className="flex">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-[#faf8f4] -mx-[1px]" />)}</div>
    </div>
  );
}

export default function MockPage() {
  return (
    <main className="flex-1 w-full max-w-[420px] mx-auto px-4 pt-10 pb-16 overflow-x-hidden bg-[#faf8f4]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo-1.svg" alt="WeatherWear" className="w-6 h-6" />
        <span className="font-[var(--font-serif)] text-[18px] text-[#3a3530]">WeatherWear</span>
      </div>

      <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-2">Layout concepts for outfit images</p>

      {/* ── OPTION A: Flat-lay strip above the section ── */}
      <p className="text-[13px] text-[#6b7c5e] font-medium mb-3 mt-6">A. Flat-lay strip</p>
      <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
        <div className="p-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-3">{mockOutfit.location}</p>
          <p className="font-[var(--font-serif)] text-[20px] text-[#3a3530] leading-snug">{mockOutfit.headline}</p>
        </div>

        <Scallop />

        {/* Flat-lay image strip */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {mockOutfit.walkOut.items.map((item) => (
              <div key={item.label} className="shrink-0">
                <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-[#ece6dc]">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-[9px] text-[#a09080] text-center mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="relative pl-6 pb-4">
            <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#d4a860] bg-[#f5f0ea]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">Walk out the door</p>
            <p className="text-[11px] text-[#b0a490] mb-2">7–9am</p>
            <p className="text-[12px] text-[#a09080] italic mb-3">{mockOutfit.walkOut.summary}</p>
            <div className="space-y-2">
              {mockOutfit.walkOut.items.map((item) => (
                <div key={item.label}>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">{item.label}</p>
                  <p className="text-[13px] text-[#5a5248]">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── OPTION B: Inline thumbnails next to each item ── */}
      <p className="text-[13px] text-[#6b7c5e] font-medium mb-3 mt-10">B. Inline thumbnails</p>
      <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
        <div className="p-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-3">{mockOutfit.location}</p>
          <p className="font-[var(--font-serif)] text-[20px] text-[#3a3530] leading-snug">{mockOutfit.headline}</p>
        </div>

        <Scallop />

        <div className="px-5 pt-4 pb-2">
          <div className="relative pl-6 pb-4">
            <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#d4a860] bg-[#f5f0ea]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">Walk out the door</p>
            <p className="text-[11px] text-[#b0a490] mb-2">7–9am</p>
            <p className="text-[12px] text-[#a09080] italic mb-3">{mockOutfit.walkOut.summary}</p>
            <div className="space-y-3">
              {mockOutfit.walkOut.items.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#ece6dc] shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490]">{item.label}</p>
                    <p className="text-[13px] text-[#5a5248]">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── OPTION C: Hero mood board grid ── */}
      <p className="text-[13px] text-[#6b7c5e] font-medium mb-3 mt-10">C. Mood board grid</p>
      <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
        <div className="p-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-3">{mockOutfit.location}</p>
          <p className="font-[var(--font-serif)] text-[20px] text-[#3a3530] leading-snug mb-4">{mockOutfit.headline}</p>

          {/* 2x2 mood board */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
            {mockOutfit.walkOut.items.map((item) => (
              <div key={item.label} className="relative aspect-square bg-[#ece6dc]">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                  <p className="text-[10px] text-white font-medium">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Scallop />

        <div className="px-5 pt-4 pb-4">
          <div className="relative pl-6 pb-4">
            <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#d4a860] bg-[#f5f0ea]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">Walk out the door</p>
            <p className="text-[11px] text-[#b0a490] mb-2">7–9am</p>
            <p className="text-[12px] text-[#a09080] italic">{mockOutfit.walkOut.summary}</p>
          </div>
          <div className="relative pl-6 pb-4">
            <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#c4a882] bg-[#f5f0ea]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">Midday shift</p>
            <p className="text-[12px] text-[#a09080] italic mt-1">{mockOutfit.carry.summary}</p>
          </div>
          <div className="relative pl-6">
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#8890a0] bg-[#f5f0ea]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">By evening</p>
            <p className="text-[12px] text-[#a09080] italic mt-1">{mockOutfit.evening.summary}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
