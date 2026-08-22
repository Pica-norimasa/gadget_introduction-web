import { ImageResponse } from "next/og";
import { getUserProfile } from "@/app/lib/queries";

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
export default async function Image({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const profile = await getUserProfile(decodeURIComponent(rawName));

  if (!profile) {
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

  const bio = profile.bio && profile.bio.length > 90 ? `${profile.bio.slice(0, 90)}…` : profile.bio;
  const hue = authorHue(profile.displayName);

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

        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- satoriはnext/imageを解決できないため生の<img>が必須
            <img
              src={profile.image}
              alt=""
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 700,
                color: "#FFFFFF",
                background: `linear-gradient(160deg, hsl(${hue} 65% 55%), hsl(${(hue + 30) % 360} 60% 38%))`,
              }}
            >
              {profile.displayName.slice(0, 1)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "#181410" }}>
              {profile.displayName}
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "rgba(20,18,14,0.65)", marginTop: 4 }}>
              {profile.works.length}件の作品を投稿
            </div>
          </div>
        </div>

        {bio ? (
          <div style={{ display: "flex", fontSize: 30, color: "rgba(20,18,14,0.78)", maxWidth: 900 }}>{bio}</div>
        ) : null}
      </div>
    ),
    size,
  );
}
