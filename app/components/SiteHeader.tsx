import Link from "next/link";
import { auth } from "@/auth";
import {
  getNotificationData,
  getPosts,
  getRecentActivity,
  getRecentReposts,
  getSuggestedAuthors,
  getWorks,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { BrandMark } from "./BrandMark";
import { ComposerFab } from "./ComposerFab";
import { FeedNavLink } from "./FeedNavLink";
import { IdentityBadge } from "./IdentityBadge";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { MobileSearch } from "./MobileSearch";
import { NotificationBell } from "./NotificationBell";
import { Sidebar } from "./Sidebar";

export async function SiteHeader({ defaultQuery }: { defaultQuery?: string } = {}) {
  const [user, { notifications, unreadCount }, session, works, posts, activity, reposts, suggestedAuthors] =
    await Promise.all([
      getCurrentUser(),
      getNotificationData(),
      auth(),
      getWorks(),
      getPosts(),
      getRecentActivity(),
      getRecentReposts(),
      getSuggestedAuthors(),
    ]);
  const authed = !!session?.user;
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
  const myProjects = user ? works.filter((w) => w.authorId === user.id) : [];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/home" className="flex items-center gap-2 shrink-0">
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

          {!authed && (
            <Link
              href="/login"
              aria-label="ログイン"
              title="ログイン"
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--line)] px-2.5 text-[12px] font-medium text-[var(--ink-soft)] hover:border-[var(--ink-faint)] sm:px-3 sm:text-[13px]"
            >
              <span>ログイン</span>
            </Link>
          )}

          <form action="/search" method="GET" className="relative hidden flex-1 max-w-md sm:block">
            <input
              type="text"
              name="q"
              defaultValue={defaultQuery}
              placeholder="「〜みたいなツールない?」で探す"
              className="w-full rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
            />
          </form>

          <nav className="ml-auto flex items-center gap-2.5 sm:gap-3.5">
            <FeedNavLink />
            <MobileSearch defaultQuery={defaultQuery} />
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          </nav>
        </div>
      </header>
      <MobileSidebarDrawer>
        <Sidebar
          ranking={rankingWorks}
          posts={posts}
          works={works}
          activity={activity}
          myProjects={myProjects}
          currentUserName={user?.name ?? null}
          reposts={reposts}
          suggestedAuthors={suggestedAuthors}
          showRankingAnchor={false}
        />
      </MobileSidebarDrawer>
      <div aria-hidden className="mobile-browser-footer-scrim" />
      <ComposerFab />
    </>
  );
}
