import type { Stage } from "@/app/lib/mock-data";

const STAGE_STYLE: Record<Stage, { bg: string; fg: string }> = {
  アイデア: { bg: "var(--violet-soft)", fg: "var(--violet)" },
  プロトタイプ: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  ベータ: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  公開中: { bg: "var(--accent-soft)", fg: "var(--accent)" },
};

export function StageBadge({ stage }: { stage: Stage }) {
  const style = STAGE_STYLE[stage];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide"
      style={{ background: style.bg, color: style.fg }}
    >
      {stage}
    </span>
  );
}
