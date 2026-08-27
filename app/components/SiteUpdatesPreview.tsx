import Link from "next/link";
import { getLatestSiteUpdates } from "@/app/lib/site-updates";

export function SiteUpdatesPreview() {
  const updates = getLatestSiteUpdates(3);

  return (
    <section className="mx-auto mt-7 max-w-[1180px] px-4 sm:px-6" aria-labelledby="site-updates-heading">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)]/55 p-4 sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">Updates</p>
            <h2 id="site-updates-heading" className="mt-1 font-[family-name:var(--font-display)] text-[16px] font-bold text-[var(--ink)]">
              最近の更新
            </h2>
          </div>
          <Link href="/updates" className="shrink-0 text-[12px] font-medium text-[var(--accent)] hover:underline">
            すべて見る →
          </Link>
        </div>

        <div className="grid gap-2.5 lg:grid-cols-3">
          {updates.map((update) => (
            <Link
              key={`${update.date}-${update.title}`}
              href="/updates"
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/30 p-3 transition-colors hover:border-[var(--accent)]"
            >
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">{update.date}</p>
              <p className="mt-1 line-clamp-1 text-[13px] font-bold text-[var(--ink)]">{update.title}</p>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-[var(--ink-faint)]">{update.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
