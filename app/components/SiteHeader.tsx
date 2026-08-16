import Link from "next/link";
import { getNotificationData } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { ComposerButton } from "./ComposerButton";
import { IdentityBadge } from "./IdentityBadge";
import { MobileSearch } from "./MobileSearch";
import { NotificationBell } from "./NotificationBell";

export async function SiteHeader({ defaultQuery }: { defaultQuery?: string } = {}) {
  const [user, { notifications, unreadCount }] = await Promise.all([getCurrentUser(), getNotificationData()]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-[15px] text-[var(--accent-ink)]">
            芽
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            Draftly
          </span>
        </Link>

        <form action="/search" method="GET" className="relative hidden flex-1 max-w-md sm:block">
          <input
            type="text"
            name="q"
            defaultValue={defaultQuery}
            placeholder="「〜みたいなツールない?」で探す"
            className="w-full rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
          />
        </form>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/#feed"
            className="hidden rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
          >
            発見する
          </Link>
          <Link
            href="/#ranking"
            className="hidden rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
          >
            ランキング
          </Link>
          <MobileSearch defaultQuery={defaultQuery} />
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          <IdentityBadge name={user?.name ?? null} />
          <ComposerButton />
        </nav>
      </div>
    </header>
  );
}
