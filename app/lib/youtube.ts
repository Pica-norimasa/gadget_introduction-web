const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

// watch/youtu.be/shorts のいずれのURL形式からも動画IDを取り出す。
// サムネイルはYouTube側が固定パス(img.youtube.com/vi/{id}/...)で常に
// 公開しているため、GitHubCardのような外部APIフェッチは不要。
export function extractYouTubeVideoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  if (u.hostname === "youtu.be") {
    const id = u.pathname.slice(1);
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (!/(^|\.)youtube\.com$/.test(u.hostname)) return null;

  if (u.pathname === "/watch") {
    const id = u.searchParams.get("v");
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  const shortsMatch = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
