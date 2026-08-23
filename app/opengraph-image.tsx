import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

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

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(160deg, #17110d 0%, #241913 54%, #12322e 100%)",
          color: "#f7f0e4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "rgba(247,240,228,0.72)" }}>
          <BrandMarkBadge size={48} />
          Draftly
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.12, maxWidth: 920 }}>
            アイデアを、
            <br />
            育てながら見せる場所
          </div>
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.45, color: "rgba(247,240,228,0.78)", maxWidth: 900 }}>
            つくり手が作ったサービス・アプリ・ゲーム・アイディアを見つけて、作りかけの進捗も気軽に残せます。
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 24, color: "rgba(247,240,228,0.64)" }}>
          見つける ・ 投稿する ・ 作り方を知る
        </div>
      </div>
    ),
    size,
  );
}
