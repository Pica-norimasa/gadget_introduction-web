import { ImageResponse } from "next/og";
import { searchByHashtag } from "@/app/lib/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// app/icon.tsx/app/components/BrandMark.tsxと同じマーク。satoriはCSS
// カスタムプロパティを解決できないため、ここでも直接ハードコードする。
function BrandMarkBadge({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4fc0a8",
        borderRadius: "50%",
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="#163530">
        <line x1="16" y1="25" x2="10" y2="18" stroke="#163530" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="18" x2="8" y2="10" stroke="#163530" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="25" x2="22" y2="18" stroke="#163530" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="18" x2="24" y2="10" stroke="#163530" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="25" r="2" />
        <circle cx="10" cy="18" r="2.3" />
        <circle cx="22" cy="18" r="2.3" />
        <circle cx="8" cy="10" r="3" />
        <circle cx="24" cy="10" r="3" />
      </svg>
    </div>
  );
}

// タグ文字列から決定的に色相を作る。AuthorAvatar.tsxのauthorHue()と同じ
// 考え方(「そのタグ」を表す色)。
function tagHue(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 360;
  }
  return hash;
}

export default async function Image({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const { works, posts } = await searchByHashtag(tag);
  const count = works.length + posts.length;
  const hue = tagHue(tag);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: `linear-gradient(160deg, hsl(${hue}, 55%, 89%), hsl(${hue}, 45%, 66%))`,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 28,
            color: "rgba(20,18,14,0.6)",
            marginBottom: 28,
          }}
        >
          <BrandMarkBadge size={36} />
          Draftly
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#181410",
            maxWidth: 1000,
            wordBreak: "break-all",
          }}
        >
          #{tag}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(20,18,14,0.72)", marginTop: 28 }}>
          {count > 0 ? `${count}件の作品・投稿` : "このタグの投稿を見る"}
        </div>
      </div>
    ),
    size,
  );
}
