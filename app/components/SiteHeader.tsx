export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-[15px] text-[var(--accent-ink)]">
            芽
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            きざし
          </span>
        </a>

        <div className="relative hidden flex-1 max-w-md sm:block">
          <input
            type="text"
            placeholder="「〜みたいなツールない?」で探す"
            className="w-full rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          <a
            href="#feed"
            className="hidden rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
          >
            発見する
          </a>
          <a
            href="#ranking"
            className="hidden rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
          >
            ランキング
          </a>
          <button
            type="button"
            aria-label="通知"
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            🔔
          </button>
          <button
            type="button"
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
          >
            投稿する
          </button>
        </nav>
      </div>
    </header>
  );
}
