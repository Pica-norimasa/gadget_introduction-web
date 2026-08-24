"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openComposer } from "@/app/lib/composer-store";

const RIGHT_CLASS_NAME =
  "mobile-floating-action-right fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--ink)] text-2xl text-[var(--bg)] shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95";
const LEFT_CLASS_NAME =
  "mobile-floating-action-left fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--ink)] text-2xl text-[var(--bg)] shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95";

// SiteHeader経由で全ページに表示される、投稿の唯一の入口(旧DiceButtonの
// 位置を引き継いだ、X/Gmail的な固定投稿ボタン)。
//
// モバイル下部の固定アクションは、ページごとに役割を絞る。
// - /home: 右下に投稿。左下の発見ボタン(ImmersiveEntry)と対になる。
// - /work/[id]: 左下に投稿。発見ボタンが無いので、右にぽつんと残さない。
// - /u/[name] と /post/[id]: 読む・プロフィール確認を邪魔しないよう非表示。
// - その他: 導線が過密にならないよう非表示。
export function ComposerFab() {
  const pathname = usePathname();
  const isHome = pathname === "/home";
  const isWorkDetail = pathname.startsWith("/work/");

  if (!isHome && !isWorkDetail) return null;

  if (isHome) {
    return (
      <button
        type="button"
        onClick={() => {
          openComposer();
          requestAnimationFrame(() => {
            document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
        aria-label="投稿する"
        title="投稿する"
        className={RIGHT_CLASS_NAME}
      >
        ✏️
      </button>
    );
  }

  return (
    <Link href="/home?composer=1#composer" aria-label="投稿する" title="投稿する" className={LEFT_CLASS_NAME}>
      ✏️
    </Link>
  );
}
