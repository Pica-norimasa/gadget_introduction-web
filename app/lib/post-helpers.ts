import type { Post } from "@/app/lib/mock-data";

// Projectの全投稿を古い順(タイムライン表示用)に返す。
// postsは呼び出し側(getPosts())で既にDB上のcreatedAt降順(新しい順)に
// 並んでいるので、それを反転するだけで正確な時系列になる。hoursAgoで
// 再ソートすると1時間単位に丸められているせいで、短時間に連続投稿した
// 場合の順序が不安定になる(実際に同じ時間帯の投稿で逆転するのを確認した)。
export function postsForProject(projectId: string, posts: Post[]): Post[] {
  return posts.filter((p) => p.projectId === projectId).reverse();
}

// カードに「いつ・何を投稿したか」をひと目で出すため、最新の投稿を1件返す。
export function latestPostFor(projectId: string, posts: Post[]): Post | null {
  const entries = posts.filter((p) => p.projectId === projectId);
  if (entries.length === 0) return null;
  return entries.reduce((latest, p) => (p.hoursAgo < latest.hoursAgo ? p : latest));
}

export function latestYouTubePostFor(projectId: string, posts: Post[]): Post | null {
  const entries = posts.filter((p) => p.projectId === projectId && p.youtubeUrl);
  if (entries.length === 0) return null;
  return entries.reduce((latest, p) => (p.hoursAgo < latest.hoursAgo ? p : latest));
}
