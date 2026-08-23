import { TextVisualCard } from "./TextVisualCard";

export function WorkThumb({
  hue,
  glyph,
  title,
  catchText = "",
  compact = false,
  size = "md",
}: {
  hue: number;
  glyph: string | null;
  title?: string;
  catchText?: string;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  // glyph未設定 = 作者が画像・動画を用意しなかった投稿。
  // そのままだと「画像なしの空白」に見えるので、投稿本文・作品名から
  // 自動生成したテキストカードとして見せる。
  if (!glyph) {
    return <TextVisualCard hue={hue} title={title} body={catchText || title || "制作メモ"} compact={compact} size={size} />;
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
