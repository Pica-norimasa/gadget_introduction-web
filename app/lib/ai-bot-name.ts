// ai-user.ts(サーバー専用、prismaを直接使う)とCommentThread.tsx
// (クライアントコンポーネント、bot本人へのコメントに「返信する」ボタンを
// 出さないための判定に使う)の両方から同じ名前を参照したいが、
// ai-user.tsをそのままクライアントへimportするとprismaがバンドルに
// 混入してしまうため、この専用ファイルに切り出している
// (session-cookie.ts/guest-limits.tsと同じパターン)。
export const AI_BOT_NAME = "Draftly AI";
