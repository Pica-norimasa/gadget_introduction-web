import type { Post } from "@/app/lib/mock-data";

// Projectの全投稿を古い順(タイムライン表示用)に返す
export function postsForProject(projectId: string, posts: Post[]): Post[] {
  return posts.filter((p) => p.projectId === projectId).sort((a, b) => b.hoursAgo - a.hoursAgo);
}

// カードに「いつ・何を投稿したか」をひと目で出すため、最新の投稿を1件返す。
export function latestPostFor(projectId: string, posts: Post[]): Post | null {
  const entries = posts.filter((p) => p.projectId === projectId);
  if (entries.length === 0) return null;
  return entries.reduce((latest, p) => (p.hoursAgo < latest.hoursAgo ? p : latest));
}
