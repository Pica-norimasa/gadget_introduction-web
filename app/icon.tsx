import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// ヘッダーのBrandMark.tsxと同じマークをfaviconにも使う。ImageResponse
// (satori)はCSSカスタムプロパティを解決できないため、globals.cssの
// --teal/--teal-softと同じ値をここでは直接ハードコードしている。
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4fc0a8",
          borderRadius: "50%",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 32 32" fill="#163530">
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
    ),
    size,
  );
}
