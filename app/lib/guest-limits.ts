// "use server"側(post-actions.ts/comment-actions.ts)とクライアント側
// (PostComposerToggle.tsx/CommentForm.tsx)の両方から同じ値を参照したいが、
// "use server"ファイルは関数以外をexportできないため、この専用ファイルに
// 切り出している(session-cookie.tsと同じパターン)。
// サービス立ち上げ初期でコメント等の投稿実績がまだ無く、ログイン必須の
// ハードルがそのまま機能不全につながるとの判断で、ゲストでも十分な件数
// (100件)まで投稿できるようにしている。荒らし対策自体はisRateLimited
// (post-actions.ts等、直近10分あたりの件数制限)側に任せる。
export const GUEST_POST_LIMIT = 100;
export const GUEST_COMMENT_LIMIT = 100;
