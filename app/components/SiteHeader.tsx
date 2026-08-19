import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { getNotificationData } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { ComposerButton } from "./ComposerButton";
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
            >
              <button
                type="submit"
                className="rounded-full px-2.5 py-1.5 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)] sm:px-3 sm:py-2"
              >
                ログアウト
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <form
                action={async () => {
                  "use server";
                  await signIn("github");
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-[var(--line)] px-2.5 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)] sm:px-3"
                >
                  GitHubでログイン
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("twitter");
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-[var(--line)] px-2.5 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)] sm:px-3"
                >
                  Xでログイン
                </button>
              </form>
            </div>
          )}
          <ComposerButton />
        </nav>
      </div>
    </header>
  );
}
