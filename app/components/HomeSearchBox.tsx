// 元はヘッダー(SiteHeader)にあった検索窓をホーム画面の主要導線
// (作品を探す/投稿する/作り方を見る)の上に移動したもの。モバイルは
// 引き続きヘッダーのアイコン検索(MobileSearch)を使うため、ここは
// デスクトップ幅のみ表示する。
export function HomeSearchBox() {
  return (
    <form action="/search" method="GET" className="mt-5 hidden sm:block">
      <input
        type="text"
        name="q"
        placeholder="「〜みたいなツールない?」で探す"
        className="w-full rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
      />
    </form>
  );
}
