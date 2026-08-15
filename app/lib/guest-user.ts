// まだログイン機構が無いため、投稿コンポーザーからの投稿はすべてこの
// 固定ユーザー名義になる。認証ができたらセッションのユーザーに置き換える。
// "use server"ファイル(post-actions.ts)は async 関数以外をexportできないため、
// この定数はpost-actions.tsと呼び出し側(page.tsx)の両方が参照できるよう
// 独立したファイルに置いている。
export const GUEST_USER_NAME = "あなた";
