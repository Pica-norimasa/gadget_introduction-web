import type { Platform } from "@/app/lib/mock-data";
import { PLATFORM_META } from "@/app/lib/platform-meta";

export function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {platforms.map((p) => (
        <span
          key={p}
          title={PLATFORM_META[p].label}
          className="grid h-5 w-5 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] text-[11px] leading-none"
        >
          {PLATFORM_META[p].icon}
        </span>
      ))}
    </span>
  );
}
