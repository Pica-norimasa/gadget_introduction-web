"use client";

import Link from "next/link";
import { openComposer } from "@/app/lib/composer-store";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HomePrimaryActions() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2.5 sm:mt-4 sm:gap-2" aria-label="最初にできること">
      <a
        href="#feed"
        onClick={(event) => {
          event.preventDefault();
          scrollTo("feed");
        }}
        className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-2.5 py-3 text-center text-[var(--ink)] transition-colors hover:border-[var(--accent)] sm:min-h-16 sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-3 sm:text-left"
      >
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[12px] font-bold text-[var(--accent)] sm:h-9 sm:w-9 sm:text-[13px]">
          探
        </span>
        <span className="min-w-0">
          <span className="mb-0.5 hidden text-[11px] font-medium text-[var(--accent)] sm:block">見るだけなら</span>
          <span className="block text-[12.5px] font-bold leading-snug sm:text-[13px]">作品を探す</span>
          <span className="hidden text-[11px] text-[var(--ink-faint)] sm:block">新着・急上昇から眺める</span>
        </span>
      </a>

      <button
        type="button"
        onClick={() => {
          openComposer();
          requestAnimationFrame(() => scrollTo("composer"));
        }}
        className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-2.5 py-3 text-center text-[var(--ink)] transition-colors hover:border-[var(--accent)] sm:min-h-16 sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-3 sm:text-left"
      >
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--teal-soft)] text-[12px] font-bold text-[var(--teal)] sm:h-9 sm:w-9 sm:text-[13px]">
          投
        </span>
        <span className="min-w-0">
          <span className="mb-0.5 hidden text-[11px] font-medium text-[var(--teal)] sm:block">作っているなら</span>
          <span className="block text-[12.5px] font-bold leading-snug sm:text-[13px]">投稿する</span>
          <span className="hidden text-[11px] text-[var(--ink-faint)] sm:block">つぶやき・アイデアを残す</span>
        </span>
      </button>

      <Link
        href="/guide/build"
        className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-2.5 py-3 text-center text-[var(--ink)] transition-colors hover:border-[var(--accent)] sm:min-h-16 sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-3 sm:text-left"
      >
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--violet-soft)] text-[12px] font-bold text-[var(--violet)] sm:h-9 sm:w-9 sm:text-[13px]">
          学
        </span>
        <span className="min-w-0">
          <span className="mb-0.5 hidden text-[11px] font-medium text-[var(--violet)] sm:block">これから作るなら</span>
          <span className="block text-[12.5px] font-bold leading-snug sm:text-[13px]">作り方を見る</span>
          <span className="hidden text-[11px] text-[var(--ink-faint)] sm:block">最初の一本までの流れ</span>
        </span>
      </Link>
    </div>
  );
}
