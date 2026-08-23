import type { Stage } from "@/app/lib/mock-data";

// StageBadge.tsxと同じ4段階のStageを、Xシェア文の絵文字・OGP開発カードの
// 進捗バー%へマッピングする共有ロジック。stage自体は数値を持たない
// カテゴリ値なので、ここでの%はあくまで目安の概算(idea=15/プロトタイプ=45/
// ベータ=75/公開中=100)。
export const STAGE_PROGRESS_PERCENT: Record<Stage, number> = {
  アイデア: 15,
  プロトタイプ: 45,
  ベータ: 75,
  公開中: 100,
};

export const STAGE_EMOJI: Record<Stage, string> = {
  アイデア: "💡",
  プロトタイプ: "🚧",
  ベータ: "🚀",
  公開中: "✨",
};
