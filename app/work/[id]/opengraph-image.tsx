import { ImageResponse } from "next/og";
import { getWorkById } from "@/app/lib/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 注意: generateImageMetadataは付けない。親route(app/work/[id]/page.tsx)側の
// generateStaticParamsが既に全workのidを網羅しているので、ここで別途
// id付きの画像バリアントを生成すると二重のid解決になり、ビルド後に
// 違うidのopengraph-imageが紐付くバグになる(実際に発生させて確認済み)。

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
            background: "#14181A",
            color: "#F1EFE9",
            fontSize: 56,
            fontWeight: 700,
          }}
        >
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

        <div style={{ display: "flex", fontSize: 28, color: "rgba(20,18,14,0.6)", marginBottom: 16 }}>
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
