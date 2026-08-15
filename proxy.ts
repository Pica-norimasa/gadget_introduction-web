import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/lib/session-cookie";

// 認証機構は無いが、訪問者ごとに別のUser行を持たせたい(投稿・リアクション・
// フォローを「あなた」という単一の共有アカウントに全員で相乗りさせないため)。
// ここではDBに触れず、opaqueなセッションCookieの発行だけを担当する
// (Prismaのネイティブアダプタはedge runtimeで動かせないため)。
// 実際のUser行はapp/lib/session.tsのgetOrCreateCurrentUser()が、
// 初回の書き込み系アクション時に遅延生成する。
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
