// Animated loading bar used by the outfit-image and drill-down loaders.
// Keyframe `breatheBar` is defined in globals.css.
export function BreatheBar({ maxWidth = 200 }: { maxWidth?: number }) {
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden bg-muted"
      style={{ maxWidth }}
    >
      <div
        className="h-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--oat-light), var(--olive), var(--oat-light))",
          backgroundSize: "300% 100%",
          animation: "breatheBar 6s ease-in-out infinite",
        }}
      />
    </div>
  );
}
