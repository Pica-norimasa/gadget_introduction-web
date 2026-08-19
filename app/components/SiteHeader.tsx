import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getNotificationData } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { BrandMark } from "./BrandMark";
import { ComposerButton } from "./ComposerButton";
import { FeedNavLink } from "./FeedNavLink";
import { IdentityBadge } from "./IdentityBadge";
import { MobileSearch } from "./MobileSearch";
import { NotificationBell } from "./NotificationBell";

export async function SiteHeader({ defaultQuery }: { defaultQuery?: string } = {}) {
  const [user, { notifications, unreadCount }, session] = await Promise.all([
    getCurrentUser(),
    getNotificationData(),
    auth(),
  ]);
  const authed = !!session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--teal)] text-[var(--teal-soft)]">
            <BrandMark className="h-[19px] w-[19px]" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            Draftly
          </span>
        </Link>

        <IdentityBadge
          name={user ? (user.displayName ?? user.name) : null}
          handle={user?.name ?? null}
          image={user?.image}
        />

        {authed ? (
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
            className="shrink-0"
          >
            <button
              type="submit"
              aria-label="ログアウト"
              title="ログアウト"
              className="grid h-9 w-9 shrink-0 place-items-center whitespace-nowrap rounded-full text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-soft)] sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:text-[13px]"
            >
              <span aria-hidden className="sm:hidden">
                🚪
              </span>
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            aria-label="ログイン"
            title="ログイン"
            className="grid h-9 w-9 shrink-0 place-items-center whitespace-nowrap rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)] sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 sm:text-[13px]"
          >
            <span aria-hidden className="sm:hidden">
              🔑
            </span>
            <span className="hidden sm:inline">ログイン</span>
          </Link>
        )}

        <div className="ml-2 shrink-0 sm:ml-8">
          <ComposerButton />
        </div>

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
          <FeedNavLink />
          <Link
            href="/#ranking"
            className="hidden rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
          >
            ランキング
          </Link>
          <MobileSearch defaultQuery={defaultQuery} />
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        </nav>
      </div>
    </header>
  );
}
