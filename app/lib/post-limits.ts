// "use server"側(post-actions.ts)とクライアント側(PostForm.tsx/
// PostEditor.tsx)の両方から同じ値を参照したいが、"use server"ファイルは
// 関数以外をexportできないため、この専用ファイルに切り出している
// (guest-limits.tsと同じパターン)。
//
// つぶやき(プロジェクトに紐づかない単独投稿)はXのポストに近い軽さを
// 保つため280文字のまま、制作タイムラインの投稿(作品に紐づく進捗報告)は
// より詳しく書けるよう500文字まで許可する。
export const STANDALONE_BODY_MAX = 280;
export const TIMELINE_BODY_MAX = 500;
