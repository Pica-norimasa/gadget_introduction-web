"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandMark } from "./BrandMark";

const menuItems = [
  { href: "/", icon: "🏠", label: "トップ", description: "Draftlyについて見る" },
  { href: "/home", icon: "🎬", label: "作品一覧", description: "作品・投稿を探す" },
  { href: "/ranking", icon: "🔥", label: "ランキング", description: "人気の作品を見る" },
  { href: "/experience", icon: "💡", label: "みんなの経験値", description: "成功も失敗も、みんなの学び" },
  { href: "/guide/build", icon: "🔧", label: "作り方ガイド", description: "プロダクト制作の始め方" },
  { href: "/updates", icon: "📝", label: "更新履歴", description: "最近の改善を見る" },
  { href: "/settings", icon: "⚙️", label: "設定", description: "表示や通知を調整する" },
  { href: "/support", icon: "💬", label: "サポート", description: "困ったことを相談する" },
];

export function BrandMenuDrawer({
  userName,
  userHandle,
  userImage,
}: {
  userName: string | null;
  userHandle: string | null;
  userImage?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const profileHref = userHandle ? `/u/${encodeURIComponent(userHandle)}` : "/login";
  const currentPath = `${pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`;
  const canUseDom = typeof document !== "undefined";

  const drawer = (
    canUseDom
      ? createPortal(
          <>
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className={`fixed inset-0 z-[70] bg-black/45 transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            <aside
              role="dialog"
              aria-modal="true"
              aria-label="サイトメニュー"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setOpen(false);
              }}
              className={`fixed inset-y-0 left-0 z-[80] flex w-[86%] max-w-[360px] flex-col overflow-y-auto border-r border-[var(--line)] bg-[var(--bg)] shadow-2xl shadow-[var(--shadow)] transition-transform duration-300 ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--teal)] text-[var(--teal-soft)]">
                    <BrandMark className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">Draftly</p>
                    <p className="text-[11px] text-[var(--ink-faint)]">アイデアを育てる場所</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <Link
                  href={profileHref}
                  className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 shadow-sm shadow-[var(--shadow)] hover:border-[var(--ink-faint)]"
                >
                  {userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ヘッダー内の小さな外部アバター表示
                    <img src={userImage} alt="" className="h-10 w-10 rounded-full" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--bg-sunken)] text-lg">👤</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold text-[var(--ink)]">
                      {userName ?? "ログインして使う"}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--ink-faint)]">
                      {userHandle ? "プロフィールを見る" : "投稿や通知を使えるようにする"}
                    </span>
                  </span>
                </Link>

                <nav className="flex flex-col gap-1.5">
                  {menuItems.map((item) => {
                    const href = ["/settings", "/support"].includes(item.href)
                      ? `${item.href}?returnTo=${encodeURIComponent(currentPath)}`
                      : item.href;

                    return (
                    <Link
                      key={item.href}
                      href={href}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-[var(--bg-sunken)]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-raised)]">
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold text-[var(--ink)]">{item.label}</span>
                        <span className="block text-[12px] text-[var(--ink-faint)]">{item.description}</span>
                      </span>
                    </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto border-t border-[var(--line)] pt-4 text-[12px] leading-6 text-[var(--ink-faint)]">
                  <a
                    href="https://note.com/draftly"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-dotted underline-offset-4 hover:text-[var(--ink-soft)]"
                  >
                    note
                  </a>
                  <span> / </span>
                  <Link href="/terms" className="hover:text-[var(--ink-soft)]">
                    利用規約
                  </Link>
                  <span> / </span>
                  <Link href="/privacy" className="hover:text-[var(--ink-soft)]">
                    プライバシー
                  </Link>
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )
      : null
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="サイトメニューを開く"
        className="flex shrink-0 items-center gap-2 rounded-full pr-1 text-left transition-opacity hover:opacity-85"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--teal)] text-[var(--teal-soft)]">
          <BrandMark className="h-[19px] w-[19px]" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">Draftly</span>
      </button>
      {drawer}
    </>
  );
}
