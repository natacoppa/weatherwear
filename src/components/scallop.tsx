// Decorative scalloped divider between card sections.
export function Scallop() {
  return (
    <div
      className="w-full h-3 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at 6px 6px, var(--background) 5.5px, transparent 6px)",
        backgroundSize: "10px 12px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
      }}
    />
  );
}
