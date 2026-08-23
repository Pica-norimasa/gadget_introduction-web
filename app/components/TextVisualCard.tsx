export function TextVisualCard({
  hue,
  title,
  body,
  label = "Draftly",
  compact = false,
  size = "md",
}: {
  hue: number;
  title?: string;
  body: string;
  label?: string;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  if (compact) {
    return (
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg"
        style={{
          background: `linear-gradient(155deg, hsl(${hue} 70% 88%), hsl(${hue + 28} 58% 70%))`,
        }}
      >
        <span
          className="absolute -right-2 -top-2 h-8 w-8 rounded-full opacity-35"
          style={{ background: `hsl(${hue + 70} 85% 62%)` }}
        />
        <span
          className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full opacity-30"
          style={{ background: `hsl(${hue - 34} 80% 55%)` }}
        />
        <span className="relative font-mono text-[15px] font-bold" style={{ color: `hsl(${hue} 50% 16%)` }}>
          Aa
        </span>
      </div>
    );
  }

  const isLarge = size === "lg";

  return (
    <div
      className={`relative flex overflow-hidden rounded-xl ${isLarge ? "aspect-[4/3] p-5" : "aspect-square p-4"}`}
      style={{
        background: `
          radial-gradient(circle at 18% 18%, hsl(${hue + 42} 90% 82% / 0.9), transparent 34%),
          radial-gradient(circle at 82% 8%, hsl(${hue - 36} 85% 76% / 0.7), transparent 30%),
          linear-gradient(155deg, hsl(${hue} 68% 90%), hsl(${hue + 22} 56% 74%))
        `,
      }}
    >
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div
        className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full opacity-25 blur-sm"
        style={{ background: `hsl(${hue + 86} 85% 55%)` }}
      />
      <div
        className={`relative flex w-full flex-col rounded-lg border border-white/30 bg-white/18 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[1px] ${
          isLarge ? "min-h-[58%] justify-start gap-4 overflow-hidden pb-7" : "h-[62%] justify-start gap-4"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full bg-white/35 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: `hsl(${hue} 48% 18%)` }}
          >
            {label}
          </span>
          <span className="h-1.5 w-10 rounded-full bg-white/45" />
        </div>
        <div>
          {title && (
            <p
              className={`font-[family-name:var(--font-display)] font-bold leading-tight ${
                isLarge ? "mb-2 line-clamp-2 text-[15px]" : "mb-2 line-clamp-2 text-[12.5px] sm:text-[14px]"
              }`}
              style={{ color: `hsl(${hue} 48% 12%)` }}
            >
              {title}
            </p>
          )}
          <p
            className={`font-[family-name:var(--font-display)] font-bold leading-snug ${
              isLarge ? "line-clamp-2 text-[13px]" : "line-clamp-2 text-[11.5px] sm:text-[12.5px]"
            }`}
            style={{ color: `hsl(${hue} 44% 18%)` }}
          >
            <span className="mr-0.5 align-top text-[1.25em] opacity-45" aria-hidden>
              ❝
            </span>
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
