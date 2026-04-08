"use client";

// ─── 1. Breathing Gradient Bar ──────────────────────────────────────

function BreathingBar() {
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="w-full max-w-[240px] h-2 rounded-full overflow-hidden bg-[#ece6dc]">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #d4b896, #c4a882, #a8b4a0, #6b7c5e, #d4b896)",
            backgroundSize: "300% 100%",
            animation: "breatheBar 6s ease-in-out infinite",
          }}
        />
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">
        Checking conditions
      </p>
      <style>{`
        @keyframes breatheBar {
          0%, 100% { background-position: 0% 50%; opacity: 0.7; }
          50% { background-position: 100% 50%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── 2. Dot Trail ───────────────────────────────────────────────────

function DotTrail() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="relative">
            <div
              className="w-3 h-3 rounded-full border-2 border-[#6b7c5e] bg-[#f5f0ea]"
              style={{
                animation: `dotPulse 4s ease-in-out infinite ${i * 0.6}s`,
              }}
            />
            {i < 4 && (
              <div
                className="absolute top-1/2 left-full w-3 h-px border-t border-dashed border-[#d4ccc0]"
                style={{ transform: "translateY(-50%)" }}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">
        Building your list
      </p>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { background-color: #f5f0ea; transform: scale(1); }
          50% { background-color: #6b7c5e; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─── 4. Scallop Reveal ──────────────────────────────────────────────

function ScallopReveal() {
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative w-full max-w-[280px] h-24 rounded-2xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
        {/* The scallop curtain */}
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ animation: "scallopSlide 5s ease-in-out infinite" }}
        >
          <div className="w-full">
            {/* Scallop edge */}
            <div className="flex justify-center overflow-hidden">
              <div className="flex">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-[#faf8f4] -mx-[1px]" />
                ))}
              </div>
            </div>
            {/* Solid fill below scallop */}
            <div className="h-20 bg-[#faf8f4]" />
          </div>
        </div>
        {/* Content being revealed */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-4">
            {["Tops", "Layers", "Shoes"].map((cat, i) => (
              <div key={cat} className="flex flex-col items-center gap-1" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="w-2 h-2 rounded-full bg-[#6b7c5e]" />
                <span className="text-[9px] text-[#a09080] uppercase tracking-wider">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">
        Unpacking your trip
      </p>
      <style>{`
        @keyframes scallopSlide {
          0% { transform: translateY(0); }
          40%, 60% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── 5. Needle & Thread ─────────────────────────────────────────────

function NeedleThread() {
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative w-full max-w-[240px] h-4 flex items-center">
        {/* Thread line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#e0d8cc]" />
        {/* Drawn line */}
        <div
          className="absolute top-1/2 left-0 h-px bg-[#6b7c5e] origin-left"
          style={{ animation: "threadDraw 5s ease-in-out infinite" }}
        />
        {/* Needle dot */}
        <div
          className="absolute top-1/2 w-2 h-2 rounded-full bg-[#6b7c5e] -translate-y-1/2"
          style={{ animation: "needleMove 5s ease-in-out infinite" }}
        />
        {/* Stitch marks */}
        {[20, 40, 60, 80].map((pct) => (
          <div
            key={pct}
            className="absolute top-1/2 w-1 h-1 rounded-full bg-[#d4ccc0] -translate-y-1/2"
            style={{ left: `${pct}%` }}
          />
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">
        Stitching it together
      </p>
      <style>{`
        @keyframes threadDraw {
          0% { width: 0%; }
          80%, 100% { width: 100%; }
        }
        @keyframes needleMove {
          0% { left: 0%; }
          80%, 100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

// ─── Preview Page ───────────────────────────────────────────────────

export default function V2PreviewPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] px-4 py-12 max-w-[420px] mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4b896] to-[#c4a882]" />
        <span className="font-[var(--font-serif)] text-[18px] text-[#3a3530]">Loading Animations</span>
      </div>

      <div className="space-y-10">
        <PreviewCard title="1. Breathing Gradient Bar" subtitle="Warm-to-sage gradient that slowly pulses like fabric in light">
          <BreathingBar />
        </PreviewCard>

        <PreviewCard title="2. Dot Trail" subtitle="Timeline dots pulse in sequence — matches the packing list nodes">
          <DotTrail />
        </PreviewCard>

        <PreviewCard title="4. Scallop Reveal" subtitle="The scalloped edge slides down like a curtain being drawn">
          <ScallopReveal />
        </PreviewCard>

        <PreviewCard title="5. Needle & Thread" subtitle="A line draws itself across with a dot traveling along — craft-y, minimal">
          <NeedleThread />
        </PreviewCard>
      </div>
    </main>
  );
}

function PreviewCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[14px] font-medium text-[#3a3530] mb-0.5">{title}</p>
      <p className="text-[12px] text-[#a09080] mb-4">{subtitle}</p>
      <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] p-8 flex items-center justify-center min-h-[140px]">
        {children}
      </div>
    </div>
  );
}
