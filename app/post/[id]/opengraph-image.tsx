import { ImageResponse } from "next/og";
import { getPostById } from "@/app/lib/queries";

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

// AuthorAvatar.tsxのauthorHue()と同じロジック。satoriはコンポーネント
// importをそのまま解決できないため、ここでも直接複製する。
function authorHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

// 注意: generateImageMetadataは付けない(app/work/[id]/opengraph-image.tsxの
// 注意書き参照。親routeのparamsをここでも別途解決すると二重のid解決になり、
// 違うidのopengraph-imageが紐付くバグになる)。
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            background: "#14181A",
            color: "#F1EFE9",
            fontSize: 56,
            fontWeight: 700,
          }}
        >
          <BrandMarkBadge size={64} />
          Draftly
        </div>
      ),
      size,
    );
  }

  const preview = post.body.length > 90 ? `${post.body.slice(0, 90)}…` : post.body;
  const hasImage = !!post.imageUrl;
  const hue = authorHue(post.authorName);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          position: "relative",
          background: hasImage
            ? "#14181A"
            : `linear-gradient(160deg, hsl(${hue}, 55%, 89%), hsl(${hue}, 45%, 66%))`,
          fontFamily: "sans-serif",
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- satoriはnext/imageを解決できないため生の<img>が必須
          <img
            src={post.imageUrl!}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
        {hasImage ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(0deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.35) 55%, rgba(10,10,10,0.05) 100%)",
            }}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 28,
            color: hasImage ? "rgba(255,255,255,0.75)" : "rgba(20,18,14,0.6)",
            marginBottom: 24,
          }}
        >
          <BrandMarkBadge size={36} />
          Draftly ・ つぶやき
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {post.authorImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- satoriはnext/imageを解決できないため生の<img>が必須
            <img
              src={post.authorImage}
              alt=""
              style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: "#FFFFFF",
                background: `linear-gradient(160deg, hsl(${hue} 65% 55%), hsl(${(hue + 30) % 360} 60% 38%))`,
              }}
            >
              {post.authorName.slice(0, 1)}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 700,
              color: hasImage ? "#FFFFFF" : "#181410",
            }}
          >
            {post.authorName}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.3,
            color: hasImage ? "#FFFFFF" : "#181410",
            maxWidth: 920,
          }}
        >
          {preview}
        </div>
      </div>
    ),
    size,
  );
}
