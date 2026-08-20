// "use server"側(post-actions.ts/comment-actions.ts)とクライアント側
// (PostComposerToggle.tsx/CommentForm.tsx)の両方から同じ値を参照したいが、
// "use server"ファイルは関数以外をexportできないため、この専用ファイルに
// 切り出している(session-cookie.tsと同じパターン)。
export const GUEST_POST_LIMIT = 3;
export const GUEST_COMMENT_LIMIT = 3;
