import { NextResponse } from "next/server";

// App Runnerのヘルスチェック用。DBには触れず、Next.jsのサーバープロセス
// 自体が応答できているかだけを見る(頻繁に叩かれるため、"/"のような
// DB問い合わせを伴うページを対象にするとヘルスチェックだけで負荷になる)。
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
