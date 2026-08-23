// LinkifiedText.tsxと同じURL判定ルールを共有するための切り出し。
// 日本語の文章はURLの直後にスペースを挟まず地の文が続くことが多い
// (例:「詳しくはhttps://example.comをどうぞ」)ため、URLとして有効な
// 文字だけを許可リストにして、それ以外(日本語・全角記号等)に当たった
// 時点で自動的に区切れるようにしている。
export const URL_PATTERN = /(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/g;
// 英語の文末記号(ピリオド・カンマ・閉じ括弧等)はURLとして有効な文字に
// 含まれるため、末尾に付いた分だけ取り除いて地の文に戻す。
export const TRAILING_PUNCTUATION = /[)\]}.,;:!?'"]+$/;

// 本文中で最初に出てくるURLを1件だけ取り出す(Xのリンクカードと同じく、
// 複数URLがあっても最初の1件だけプレビューする)。
export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_PATTERN);
  if (!match) return null;
  const raw = match[0];
  const trailingMatch = raw.match(TRAILING_PUNCTUATION);
  return trailingMatch ? raw.slice(0, -trailingMatch[0].length) : raw;
}
