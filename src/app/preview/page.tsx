"use client";

import {
  ColorStory,
  SilkShimmer,
  TypographyCascade,
  PulseOrb,
  EditorialSequence,
} from "@/components/loaders";

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-[#faf8f6] px-5 py-12 max-w-[440px] mx-auto">
      <h1 className="font-[var(--font-serif)] text-[24px] text-[#1a1a1a] mb-2">
        Loading Animations
      </h1>
      <p className="text-[13px] text-[#999] mb-10">Pick your favorite. Each takes full screen.</p>

      <div className="space-y-16">
        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a] mb-0.5">1. Color Story</p>
          <p className="text-[12px] text-[#aaa] mb-4">Breathing gradient, light moves across — like a mood being set</p>
          <ColorStory />
        </div>

        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a] mb-0.5">2. Silk Shimmer</p>
          <p className="text-[12px] text-[#aaa] mb-4">Diagonal light catches moving across fabric</p>
          <SilkShimmer />
        </div>

        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a] mb-0.5">3. Typography Cascade</p>
          <p className="text-[12px] text-[#aaa] mb-4">Weather + fabric words drift in like an editorial spread</p>
          <TypographyCascade />
        </div>

        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a] mb-0.5">4. Pulse Orb</p>
          <p className="text-[12px] text-[#aaa] mb-4">Soft organic shape breathes and shifts color — like a mood ring</p>
          <PulseOrb />
        </div>

        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a] mb-0.5">5. Editorial Sequence</p>
          <p className="text-[12px] text-[#aaa] mb-4">Large serif words appear one at a time — fashion film title sequence</p>
          <EditorialSequence />
        </div>
      </div>
    </main>
  );
}
