export function WorkThumb({
  hue,
  glyph,
  catchText = "",
  compact = false,
  size = "md",
}: {
  hue: number;
  glyph: string | null;
  catchText?: string;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  // glyph未設定 = 作者が画像・動画を用意しなかった投稿。
  // 空欄やプレースホルダにせず、キャッチコピーを大きな引用として見せる
  // (サイドバーの小さい枠(compact)では読めないので、汎用アイコンにフォールバック)。
  if (!glyph && compact) {
    return (
      <div
        className="flex aspect-square items-center justify-center rounded-lg text-sm"
        style={{
          background: `linear-gradient(155deg, hsl(${hue} 55% 89%), hsl(${hue} 40% 70%))`,
        }}
      >
        <span aria-hidden>📝</span>
      </div>
    );
  }

  if (!glyph) {
    return (
      <div
        className={`flex items-center rounded-xl p-4 ${
          size === "lg" ? "aspect-[4/3]" : "aspect-square"
        }`}
        style={{
          background: `linear-gradient(155deg, hsl(${hue} 55% 89%), hsl(${hue} 40% 70%))`,
        }}
      >
        <p
          className={`font-[family-name:var(--font-display)] font-bold leading-snug ${
            size === "lg" ? "text-[15px] line-clamp-5" : "text-[13px] line-clamp-4"
          }`}
          style={{ color: `hsl(${hue} 45% 15%)` }}
        >
          <span className="mr-0.5 align-top text-[1.3em] opacity-40" aria-hidden>
            ❝
          </span>
          {catchText}
        </p>
      </div>
    );
  }

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
