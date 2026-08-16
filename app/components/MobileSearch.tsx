"use client";

import { useEffect, useRef, useState } from "react";

// スマホ幅ではヘッダーの検索フォーム(sm:block)自体が非表示になるため、
// 虫眼鏡アイコン→タップでヘッダー行いっぱいに検索欄を展開する代替UIを出す。
export function MobileSearch({ defaultQuery }: { defaultQuery?: string }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (open) {
    return (
      <form
        action="/search"
        method="GET"
        className="absolute inset-0 z-20 flex items-center gap-2 bg-[var(--bg)] px-4 sm:hidden"
      >
        <button
          type="button"
          aria-label="検索を閉じる"
          onClick={() => setOpen(false)}
          className="shrink-0 text-lg text-[var(--ink-soft)]"
        >
          ←
        </button>
        <input
          ref={inputRef}
          type="text"
          name="q"
          defaultValue={defaultQuery}
          placeholder="「〜みたいなツールない?」で探す"
          className="w-full rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      aria-label="検索"
      onClick={() => setOpen(true)}
      className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] sm:hidden"
    >
      🔍
    </button>
  );
}
