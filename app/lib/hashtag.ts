// LinkifiedText.tsx(表示側、#タグをリンクに変換)とqueries.ts
// (検索側、本文からタグを抽出して絞り込む)の両方で使う共通のパターン。
// URL_PATTERN(LinkifiedText.tsx)と同じ考え方で、記号を拾いすぎないよう
// 許可リスト方式にしている(任意の文字種の「文字」「数字」「_」「ー」
// (カタカナ語の長音符、Unicodeの文字カテゴリには入らないため明示的に許可)
// だけを対象にし、スペースや句読点・絵文字に当たった時点で自動的に
// 区切れるようにする)。
export const HASHTAG_PATTERN = /#([\p{L}\p{N}_ー]+)/gu;

export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const m of text.matchAll(HASHTAG_PATTERN)) tags.add(m[1]);
  return [...tags];
}
