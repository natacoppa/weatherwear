"use client";

import { useEffect, useState } from "react";

// Typewriter-style rotator through a list of stylist-voice phrases.
// Used by OutfitLoader while the AI composes a look.
export function StylistVoice({ phrases }: { phrases: string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = phrases[phraseIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 35 + Math.random() * 30);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCharIdx(0);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }, 1600);
    return () => clearTimeout(t);
  }, [charIdx, phraseIdx, phrases]);

  const current = phrases[phraseIdx];
  return (
    <p className="font-[var(--font-serif)] text-[18px] md:text-[22px] text-foreground italic leading-[1.4] text-center min-h-[3em]">
      {current.slice(0, charIdx)}
      <span className="inline-block w-[2px] h-[0.9em] bg-clay ml-1 -mb-[0.1em] animate-[blink_1s_steps(2)_infinite]" />
    </p>
  );
}
