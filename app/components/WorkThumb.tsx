export function WorkThumb({
  hue,
  glyph,
  size = "md",
}: {
  hue: number;
  glyph: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl ${
        size === "lg" ? "aspect-[4/3] text-4xl" : "aspect-square text-2xl"
      }`}
      style={{
        background: `linear-gradient(155deg, hsl(${hue} 70% 92%), hsl(${hue} 55% 82%))`,
      }}
    >
      <span aria-hidden>{glyph}</span>
    </div>
  );
}
