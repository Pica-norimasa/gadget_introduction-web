import type { Platform } from "@/app/lib/mock-data";
import { PLATFORM_META } from "@/app/lib/platform-meta";

export function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {platforms.map((p) => {
        const { Icon, label } = PLATFORM_META[p];
        return (
          <span
            key={p}
            title={label}
            className="grid h-5 w-5 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] text-[var(--ink-soft)]"
          >
            <Icon className="h-3 w-3" />
          </span>
        );
      })}
    </span>
  );
}
