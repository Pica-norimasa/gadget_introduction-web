"use client";

import Link from "next/link";
import { openComposer } from "@/app/lib/composer-store";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HomePrimaryActions() {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="最初にできること">
      <a
        href="#feed"
        onClick={(event) => {
          event.preventDefault();
          scrollTo("feed");
        }}
        className="flex min-h-16 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[13px] font-bold text-[var(--accent)]">
          探
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-[var(--accent)]">見るだけなら</span>
          <span className="block text-[13px] font-bold">作品を探す</span>
          <span className="block text-[11px] text-[var(--ink-faint)]">新着・急上昇から眺める</span>
        </span>
      </a>

      <button
        type="button"
        onClick={() => {
          openComposer();
          requestAnimationFrame(() => scrollTo("composer"));
        }}
        className="flex min-h-16 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--teal-soft)] text-[13px] font-bold text-[var(--teal)]">
          投
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-[var(--teal)]">作っているなら</span>
          <span className="block text-[13px] font-bold">投稿する</span>
          <span className="block text-[11px] text-[var(--ink-faint)]">つぶやき・アイデアを残す</span>
        </span>
      </button>

      <Link
        href="/guide/build"
        className="flex min-h-16 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--violet-soft)] text-[13px] font-bold text-[var(--violet)]">
          学
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-[var(--violet)]">これから作るなら</span>
          <span className="block text-[13px] font-bold">作り方を見る</span>
          <span className="block text-[11px] text-[var(--ink-faint)]">最初の一本までの流れ</span>
        </span>
      </Link>
    </div>
  );
}
