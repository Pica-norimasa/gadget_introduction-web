import type { Platform } from "@/app/lib/mock-data";
import { PLATFORM_META } from "@/app/lib/platform-meta";
import { TrackedLink } from "./TrackedLink";

// WorkCard.tsxではカード全体がstretched linkになっているため、各アイコンを
// クリックできるようにするにはrelative z-20が要る(WorkCard.tsxの
// BookmarkButton等と同じパターン)。WorkDetail.tsxのような非stretched-link
// な文脈でも無害なので、常に付けている。
export function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {platforms.map((p) => {
        const { Icon, label } = PLATFORM_META[p];
        return (
          <TrackedLink
            key={p}
            href={`/platform/${encodeURIComponent(p)}`}
            trackType="platform_badge_click"
            trackTarget={p}
            title={label}
            className="relative z-20 grid h-5 w-5 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Icon className="h-3 w-3" />
          </TrackedLink>
        );
      })}
    </span>
  );
}
