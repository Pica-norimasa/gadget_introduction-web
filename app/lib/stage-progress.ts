import type { Stage } from "@/app/lib/mock-data";

// StageBadge.tsxと同じ5段階のStageを、Xシェア文の絵文字・OGP開発カードの
// 進捗バー%へマッピングする共有ロジック。stage自体は数値を持たない
// カテゴリ値なので、ここでの%はあくまで目安の概算(idea=15/プロトタイプ=45/
// ベータ=75/公開中=100)。開発中止は「進んだ度合い」を表す値ではないため、
// 呼び出し側(work/[id]/opengraph-image.tsx)は0%を進捗バーとして描かず、
// 「開発中止」ラベルに差し替えて使う。
export const STAGE_PROGRESS_PERCENT: Record<Stage, number> = {
  アイデア: 15,
  プロトタイプ: 45,
  ベータ: 75,
  公開中: 100,
  開発中止: 0,
};

export const STAGE_EMOJI: Record<Stage, string> = {
  アイデア: "💡",
  プロトタイプ: "🚧",
  ベータ: "🚀",
  公開中: "✨",
  開発中止: "📕",
};
