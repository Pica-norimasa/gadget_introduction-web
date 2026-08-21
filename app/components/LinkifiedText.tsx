// 日本語の文章はURLの直後にスペースを挟まず地の文が続くことが多い
// (例:「詳しくはhttps://example.comをどうぞ」)。[^\s]+のような素朴な
// 判定だと「をどうぞ」まで拾ってしまうため、URLとして有効な文字だけを
// 許可リストにして、それ以外(日本語・全角記号等)に当たった時点で
// 自動的に区切れるようにする。
const URL_PATTERN = /(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/g;
// それでも英語の文末記号(ピリオド・カンマ・閉じ括弧等)はURLとして有効な
// 文字に含まれるため、末尾に付いた分だけ取り除いて地の文に戻す。
const TRAILING_PUNCTUATION = /[)\]}.,;:!?'"]+$/;

// 投稿・コメント本文中のURLをクリック可能なリンクに変換する。本文は
// プレーンテキストのみでMarkdown等には対応していないため、素朴な正規表現
// でhttp(s)://始まりの文字列を検出するだけの簡易実装。
export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(URL_PATTERN);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part;

        const trailingMatch = part.match(TRAILING_PUNCTUATION);
        const trailing = trailingMatch ? trailingMatch[0] : "";
        const url = trailing ? part.slice(0, -trailing.length) : part;

        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[var(--accent)] hover:underline"
            >
              {url}
            </a>
            {trailing}
          </span>
        );
      })}
    </span>
  );
}
