import { ImageResponse } from "next/og";
import { getWorkById } from "@/app/lib/queries";

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

// 注意: generateImageMetadataは付けない。親route(app/work/[id]/page.tsx)の
// paramsをここでも別途解決すると二重のid解決になり、違うidの
// opengraph-imageが紐付くバグになる(実際に発生させて確認済み)。

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWorkById(id);

  if (!work) {
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

  const preview = work.catch.length > 78 ? `${work.catch.slice(0, 78)}…` : work.catch;

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
          background: `linear-gradient(160deg, hsl(${work.hue}, 55%, 89%), hsl(${work.hue}, 45%, 66%))`,
          fontFamily: "sans-serif",
        }}
      >
        {work.glyph ? (
          <div
            style={{
              position: "absolute",
              top: 56,
              right: 64,
              fontSize: 200,
              display: "flex",
            }}
          >
            {work.glyph}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: "rgba(20,18,14,0.6)", marginBottom: 16 }}>
          <BrandMarkBadge size={36} />
          Draftly ・ {work.stage}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#181410",
            lineHeight: 1.15,
            maxWidth: 880,
          }}
        >
          {work.title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(20,18,14,0.78)",
            marginTop: 24,
            maxWidth: 860,
          }}
        >
          {preview}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "rgba(20,18,14,0.6)", marginTop: 32 }}>
          by {work.author}
        </div>
      </div>
    ),
    size,
  );
}
