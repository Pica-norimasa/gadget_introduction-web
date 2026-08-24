import { EXPERIENCE_TYPE_META, type ExperienceType } from "@/app/lib/mock-data";

// PostTypeBadge.tsx(制作中/リリース等、色分けした塗りつぶしバッジ)とは
// 意図的にトーンを分ける。「経験タイプ」は色で強調するものではなく、
// あくまで控えめな任意タグなので、枠線のみのモノクロ表示にする
// (「色を使いすぎない」という要望への対応)。
export function ExperienceTypeBadge({ type, className = "" }: { type: ExperienceType; className?: string }) {
  const meta = EXPERIENCE_TYPE_META[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-[var(--ink-soft)] ${className}`}
    >
      {meta.icon} {meta.label}
    </span>
  );
}
