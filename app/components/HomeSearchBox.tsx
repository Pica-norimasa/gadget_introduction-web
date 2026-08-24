// 元はヘッダー(SiteHeader、デスクトップの常時表示欄とモバイルの
// アイコン検索の両方)にあった検索窓をホーム画面の主要導線
// (作品を探す/投稿する/作り方を見る)の上に移動したもの。ヘッダー側は
// 全幅で完全に廃止したため、ここはモバイル・デスクトップ問わず表示する。
export function HomeSearchBox() {
  return (
    <form action="/search" method="GET" className="mt-5">
      <input
        type="text"
        name="q"
        placeholder="「〜みたいなツールない?」で探す"
        className="w-full rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
      />
    </form>
  );
}
