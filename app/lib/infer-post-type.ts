import type { PostType } from "@/app/lib/mock-data";

// 本物のAI分類の代わりの簡易ヒューリスティック。投稿フォームで種別を
// 選ばせず、書いた文章から推測する体験を最小コストで再現する。
export function inferPostType(body: string): PostType {
  const text = body.trim();
  if (!text) return "making";
  if (/[?？]\s*$/.test(text) || /どう思います|どうですか|でしょうか/.test(text)) return "question";
  if (/欲しい|ほしい/.test(text)) return "idea";
  if (/リリース|公開しました|正式版/.test(text)) return "release";
  if (/できた|動いた|完成した|繋がった|つながった/.test(text)) return "demo";
  if (/公開/.test(text)) return "prototype";
  return "making";
}
