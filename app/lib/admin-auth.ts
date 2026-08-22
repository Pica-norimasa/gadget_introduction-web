import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/app/lib/admin-cookie";

// 本格的な認証基盤(ユーザー権限テーブル等)を用意する代わりの、環境変数
// ADMIN_KEYと突き合わせるだけの軽量な管理者ゲート。ADMIN_KEYが未設定なら
// 誰も入れない(空文字同士が一致してしまう事故を防ぐ)。
export async function isAdminAuthed(): Promise<boolean> {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;

  const cookieValue = (await cookies()).get(ADMIN_COOKIE)?.value;
  return cookieValue === adminKey;
}
