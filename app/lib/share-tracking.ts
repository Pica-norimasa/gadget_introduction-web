// Xシェア経由の流入にUTMパラメータを付与する共有ヘルパー。今回は
// URLへのタグ付けまでで、着地後にcookie等へ保存してユーザー登録に紐付ける
// アトリビューションは次フェーズで対応する(docs/todo.md参照)。
// 業界標準のutm_*を使うのは、将来Google Analytics等を足しても
// そのまま通用するようにするため。
export function withShareTracking(url: string, campaign: string = "share"): string {
  const target = new URL(url);
  target.searchParams.set("utm_source", "x");
  target.searchParams.set("utm_medium", "social");
  target.searchParams.set("utm_campaign", campaign);
  return target.toString();
}
