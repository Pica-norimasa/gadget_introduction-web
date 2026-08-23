import { POST_TYPE_META, type PostType } from "@/app/lib/mock-data";

// StageBadge.tsxと同じ4色パレットを使い回す。8種のtypeを意味の近さで
// 4色にグルーピングする(idea系=violet、進行中系=amber、日々のログ=teal、
// releaseはStageBadgeの「公開中」と揃えてaccent)。questionだけは
// 制作の節目ではない雑談枠なので、あえて無色(ink-faint)にして目立たせない。
const POST_TYPE_STYLE: Record<PostType, { bg: string; fg: string } | null> = {
  idea: { bg: "var(--violet-soft)", fg: "var(--violet)" },
  making: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  prototype: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  screenshot: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  demo: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  update: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  release: { bg: "var(--accent-soft)", fg: "var(--accent)" },
  question: null,
};

export function PostTypeBadge({ type, className = "" }: { type: PostType; className?: string }) {
  const meta = POST_TYPE_META[type];
  const style = POST_TYPE_STYLE[type];

  if (!style) {
    return (
      <span className={`inline-flex items-center gap-1 text-[var(--ink-faint)] ${className}`}>
        {meta.icon} {meta.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${className}`}
      style={{ background: style.bg, color: style.fg }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}
