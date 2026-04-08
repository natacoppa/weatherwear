export default function LogosPage() {
  const logos = [
    { file: "/logo-1.svg", name: "Sun Petals", desc: "Alternating sage/tan petals radiating from cream center — sun meets fabric folds" },
    { file: "/logo-2.svg", name: "Needle & Cloud", desc: "A needle threading through a cloud shape" },
    { file: "/logo-3.svg", name: "Hanger + Sun", desc: "A hanger silhouette with sun rays" },
    { file: "/logo-4.svg", name: "Shirt Collar + Sun", desc: "Shirt collar with a small sun element" },
    { file: "/logo-5.svg", name: "Abstract W", desc: "Flowing fabric lines forming a W with weather element" },
  ];

  return (
    <main className="min-h-screen bg-[#faf8f4] px-4 py-12 max-w-[420px] mx-auto">
      <h1 className="font-[family-name:var(--font-serif)] text-[24px] text-[#3a3530] mb-2">
        Logo Options
      </h1>
      <p className="text-[13px] text-[#a09080] mb-10">Pick your favorite.</p>

      <div className="space-y-8">
        {logos.map((logo, i) => (
          <div key={i}>
            <p className="text-[14px] font-medium text-[#3a3530] mb-0.5">{i + 1}. {logo.name}</p>
            <p className="text-[12px] text-[#a09080] mb-4">{logo.desc}</p>

            <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] p-8 flex items-center justify-center">
              <div className="flex items-center gap-8">
                {/* Large */}
                <div className="flex flex-col items-center gap-2">
                  <img src={logo.file} alt={logo.name} className="w-16 h-16" />
                  <span className="text-[9px] text-[#b0a490]">64px</span>
                </div>
                {/* Medium */}
                <div className="flex flex-col items-center gap-2">
                  <img src={logo.file} alt={logo.name} className="w-8 h-8" />
                  <span className="text-[9px] text-[#b0a490]">32px</span>
                </div>
                {/* With text */}
                <div className="flex items-center gap-2">
                  <img src={logo.file} alt={logo.name} className="w-6 h-6" />
                  <span className="font-[family-name:var(--font-serif)] text-[18px] text-[#3a3530]">WeatherWear</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
