// middleware.ts(edge runtime、Cookie発行のみ)とapp/lib/session.ts(Node runtime、
// 実際のUser行の読み書き)の両方から参照するため、独立したファイルに置く。
export const SESSION_COOKIE = "kizashi_session";
