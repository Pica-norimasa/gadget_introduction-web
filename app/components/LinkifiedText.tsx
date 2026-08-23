import Link from "next/link";
import { HASHTAG_PATTERN } from "@/app/lib/hashtag";
import { TRAILING_PUNCTUATION, URL_PATTERN } from "@/app/lib/url-extract";

// 投稿・コメント本文中のURLと#ハッシュタグをクリック可能なリンクに変換する。
// 本文はプレーンテキストのみでMarkdown等には対応していないため、素朴な
// 正規表現でhttp(s)://始まりの文字列と#タグを検出するだけの簡易実装。
// URL側の判定を優先し(URL内の#フラグメントをタグと誤認しないよう)、
// URL以外の地の文だけをさらに#タグで区切る。
export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(URL_PATTERN);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!/^https?:\/\//.test(part)) return <HashtagSegment key={i} text={part} />;

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

// ExpandableText.tsx(WorkCardのカード説明文)からも同じ#タグ検出を再利用
// するためexportしている。WorkCardはカード全体をstretched linkにしているため
// (WorkCard.tsxのコメント参照)、その上でタグ単体をクリックできるように
// linkClassNameで個別にz-20を足せるようにしてある。
export function HashtagSegment({
  text,
  linkClassName = "text-[var(--accent)] hover:underline",
}: {
  text: string;
  linkClassName?: string;
}) {
  const parts = text.split(HASHTAG_PATTERN);
  if (parts.length === 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Link key={i} href={`/tag/${encodeURIComponent(part)}`} className={linkClassName}>
            #{part}
          </Link>
        ) : (
          part
        ),
      )}
    </>
  );
}
