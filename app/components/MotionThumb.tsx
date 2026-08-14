"use client";

import { useEffect, useRef, useState } from "react";

export function MotionThumb({
  hue,
  glyph,
  size = "md",
}: {
  hue: number;
  glyph: string;
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // スクロールで画面内に大きく入ったら、TikTok的に自動でプレビューを再生する
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.6,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[length:180%_180%] ${
        size === "lg" ? "aspect-[4/3] text-4xl" : "aspect-square text-2xl"
      } ${active ? "[animation:motion-drift_2.4s_ease-in-out_infinite]" : ""}`}
      style={{
        background: `linear-gradient(155deg, hsl(${hue} 70% 92%), hsl(${hue} 55% 82%))`,
      }}
    >
      <span
        className={active ? "[animation:motion-bob_1.1s_ease-in-out_infinite]" : ""}
        aria-hidden
      >
        {glyph}
      </span>
      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        <span aria-hidden>{active ? "🔇" : "▶"}</span>
        {active ? "再生中" : "プレビュー"}
      </span>
    </div>
  );
}
