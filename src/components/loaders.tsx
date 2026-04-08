"use client";

import { useEffect, useState } from "react";

// ─── 1. Color Story ─────────────────────────────────────────────────
// Full bleed gradient that slowly breathes between warm and cool
// like a mood being set. Minimal, immersive, fashion-forward.

export function ColorStory() {
  return (
    <div className="relative w-full min-h-[60vh] rounded-3xl overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #f5ddd0, #f0d0d8, #e0d0e8, #d0dce8, #f5ddd0)",
          backgroundSize: "400% 400%",
          animation: "colorBreathe 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.8) 0%, transparent 50%)",
          animation: "lightMove 8s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-[var(--font-serif)] text-[32px] text-[#1a1a1a]/30 mb-2">
          styling
        </p>
        <div className="w-8 h-[1px] bg-[#1a1a1a]/15" />
      </div>
      <style>{`
        @keyframes colorBreathe {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        @keyframes lightMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20%, 10%) scale(1.2); }
          66% { transform: translate(-10%, 20%) scale(0.9); }
        }
      `}</style>
    </div>
  );
}

// ─── 2. Silk Shimmer ────────────────────────────────────────────────
// Abstract diagonal shimmer that moves across like light on fabric.
// Full screen, feels expensive.

export function SilkShimmer() {
  return (
    <div className="relative w-full min-h-[60vh] rounded-3xl overflow-hidden bg-[#f3ede8]">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.5) 30%, transparent 40%)",
          backgroundSize: "200% 100%",
          animation: "shimmerSlide 2.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: "linear-gradient(160deg, #fce4d6 0%, #f3ede8 30%, #e8dff5 60%, #f3ede8 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(110deg, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%)",
          backgroundSize: "200% 100%",
          animation: "shimmerSlide 2.5s ease-in-out infinite 0.8s",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#1a1a1a]/25">
          reading the weather
        </p>
      </div>
      <style>{`
        @keyframes shimmerSlide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── 3. Typography Cascade ──────────────────────────────────────────
// Weather words drift across in different sizes and opacities
// Like an editorial spread being composed

const driftWords = [
  { text: "sun", size: 48, x: 15, y: 20, delay: 0 },
  { text: "wind", size: 28, x: 60, y: 35, delay: 0.4 },
  { text: "warmth", size: 56, x: 25, y: 55, delay: 0.8 },
  { text: "shade", size: 32, x: 55, y: 72, delay: 1.2 },
  { text: "layer", size: 40, x: 10, y: 82, delay: 1.6 },
  { text: "cashmere", size: 24, x: 50, y: 15, delay: 2.0 },
  { text: "linen", size: 36, x: 65, y: 88, delay: 2.4 },
];

export function TypographyCascade() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => setVisible(true), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-[60vh] rounded-3xl overflow-hidden bg-gradient-to-br from-[#faf6f2] to-[#f0ece8]">
      {driftWords.map((word, i) => (
        <span
          key={word.text}
          className="absolute font-[var(--font-serif)] text-[#1a1a1a] transition-all duration-1000 ease-out"
          style={{
            fontSize: word.size,
            left: `${word.x}%`,
            top: `${word.y}%`,
            opacity: visible ? 0.06 + i * 0.02 : 0,
            transform: visible
              ? "translateY(0)"
              : "translateY(20px)",
            transitionDelay: `${word.delay}s`,
          }}
        >
          {word.text}
        </span>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="font-[var(--font-serif)] text-[20px] text-[#1a1a1a]/40">
            composing your look
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Pulse Orb ──────────────────────────────────────────────────
// Soft organic shape that breathes and shifts color,
// like a mood ring deciding what you should wear

export function PulseOrb() {
  return (
    <div className="relative w-full min-h-[60vh] rounded-3xl overflow-hidden bg-[#faf8f6] flex items-center justify-center">
      <div className="relative w-48 h-48">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, #f0d0d8 0%, #e0d0e8 40%, transparent 70%)",
            animation: "orbBreathe 4s ease-in-out infinite",
          }}
        />
        {/* Inner shape */}
        <div
          className="absolute inset-6 rounded-full"
          style={{
            background: "linear-gradient(135deg, #fce4d6, #f0d0d8, #e0d0e8, #d0dce8)",
            backgroundSize: "200% 200%",
            animation: "colorBreathe 5s ease-in-out infinite, orbBreathe 4s ease-in-out infinite",
            filter: "blur(1px)",
          }}
        />
        {/* Highlight */}
        <div
          className="absolute inset-10 rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8) 0%, transparent 50%)",
          }}
        />
      </div>
      <div className="absolute bottom-16 left-0 right-0 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccc]">
          sensing conditions
        </p>
      </div>
      <style>{`
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes colorBreathe {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
      `}</style>
    </div>
  );
}

// ─── 5. Editorial Sequence ──────────────────────────────────────────
// Words appear one at a time in large serif, building a sentence.
// Feels like a fashion film title sequence.

const sequence = [
  "checking",
  "the sky",
  "picking",
  "the fabric",
  "styling",
  "your day",
];

export function EditorialSequence() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % sequence.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-[60vh] rounded-3xl overflow-hidden bg-gradient-to-b from-[#faf8f6] to-[#f2ede8] flex items-center justify-center">
      <div className="text-center px-8">
        {sequence.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="absolute inset-0 flex items-center justify-center font-[var(--font-serif)] leading-tight transition-all duration-700"
            style={{
              fontSize: word.length > 8 ? 36 : 48,
              opacity: i === index ? 1 : 0,
              transform: i === index ? "translateY(0)" : i < index ? "translateY(-30px)" : "translateY(30px)",
              color: i % 2 === 0 ? "#c4a88e" : "#1a1a1a",
            }}
          >
            {word}
          </span>
        ))}
      </div>
      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5">
        {sequence.map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full transition-all duration-500"
            style={{
              backgroundColor: i === index ? "#c4a88e" : "#e0dcd8",
              transform: i === index ? "scale(1.5)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
